-- ============================================================================
-- CHAOCHAO — ROW LEVEL SECURITY (RLS) POLICIES
-- ครอบคลุมทั้ง 21 ตาราง อิงตาม 3 บทบาท: renter, lender (คนเดียวกันได้ทั้งคู่), admin
-- ============================================================================


-- ============================================================================
-- ★ PREREQUISITE — ผูก UserAccount.user_id เข้ากับ auth.uid()
-- ถ้าไม่ทำขั้นนี้ RLS ด้านล่างทั้งหมดจะเช็ค "เจ้าของแถว" ไม่ได้เลย
-- ============================================================================

-- ให้ user_id ใหม่ default มาจาก auth.uid() แทน gen_random_uuid()
ALTER TABLE UserAccount ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ผูก FK ไปยังตาราง auth.users ของ Supabase Auth โดยตรง
-- (รันบรรทัดนี้ได้ก็ต่อเมื่อยังไม่มีข้อมูลเก่าที่ user_id ไม่ตรงกับ auth.users อยู่ในตาราง)
ALTER TABLE UserAccount
  ADD CONSTRAINT fk_useraccount_authuser FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- แนะนำเพิ่มเติม (ทำใน Supabase Dashboard หรือเขียน trigger เพิ่ม):
-- ตั้ง trigger บน auth.users ให้ INSERT แถวลง UserAccount อัตโนมัติทันทีที่มีคน
-- สมัครผ่าน Supabase Auth (เช่น supabase.auth.signUp) เพื่อให้ user_id ตรงกันเสมอ
-- โดยไม่ต้องพึ่ง client ส่ง user_id เองให้ตรงบังเอิญ


-- ============================================================================
-- HELPER FUNCTIONS — ใช้ซ้ำในหลาย policy ด้านล่าง
-- SECURITY DEFINER ทำให้ฟังก์ชันมีสิทธิ์อ่านตารางได้เต็มที่แม้คนเรียกจะโดน RLS
-- จำกัดอยู่ก็ตาม (ไม่งั้นจะเช็คสิทธิ์ตัวเองไม่ได้ วนลูปตายเปล่า)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM User_Role_Assignment ura
    JOIN Role r ON r.role_id = ura.role_id
    WHERE ura.user_id = auth.uid() AND r.role_type = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION owns_item(p_item_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM Item WHERE item_id = p_item_id AND user_id = auth.uid());
$$;

-- "participant" ของ order = คนที่เป็นผู้เช่า หรือเป็นเจ้าของสินค้าที่ถูกเช่า
CREATE OR REPLACE FUNCTION is_order_participant(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM RentalOrder ro
    JOIN Item i ON i.item_id = ro.item_id
    WHERE ro.order_id = p_order_id
      AND (ro.user_id = auth.uid() OR i.user_id = auth.uid())
  );
$$;


-- ============================================================================
-- 1. Role — ตารางอ้างอิง อ่านได้ทุกคน แก้ไม่ได้เลย (ยกเว้น service_role ที่ bypass RLS)
-- ============================================================================
ALTER TABLE Role ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_select_all ON Role FOR SELECT USING (true);


-- ============================================================================
-- 2. UserAccount
-- หมายเหตุสำคัญ: RLS ทำงานระดับ "ทั้งแถว" ไม่ใช่ระดับคอลัมน์ ดังนั้นถ้าจะให้คนอื่นเห็น
-- โปรไฟล์แบบ public (เช่น ตอนดูหน้าเจ้าของสินค้า) ต้องสร้าง VIEW แยกที่ SELECT เฉพาะ
-- คอลัมน์ปลอดภัย (username, firstname, status) ไม่รวม email/password/national_id
-- แล้วเปิด SELECT ให้ view นั้นแทน ไม่ใช่เปิด SELECT ตารางเต็มให้ทุกคน
-- ============================================================================
ALTER TABLE UserAccount ENABLE ROW LEVEL SECURITY;

CREATE POLICY useraccount_select_own_or_admin ON UserAccount
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY useraccount_insert_self ON UserAccount
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY useraccount_update_own_or_admin ON UserAccount
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- ไม่มี DELETE policy เลยแม้แต่ admin = ห้ามลบเด็ดขาด ตรงกับที่ตกลงกันไว้ (ใช้ status แทน)


-- View สำหรับโปรไฟล์สาธารณะ (ใช้ตอนแสดงข้อมูลเจ้าของสินค้าให้คนอื่นดู เช่น ตอน browse สินค้า)
-- สำคัญ: "ไม่ต้อง" ตั้ง security_invoker = true ตรงนี้ (ปล่อยเป็นค่า default)
-- เพราะเป้าหมายของ view นี้คือให้ "ทุกคนเห็นชื่อ/สถานะของเจ้าของสินค้าได้" ซึ่งตรงข้ามกับ
-- RLS ของ UserAccount ที่จำกัดไว้แค่ "เจ้าของแถว + admin" เท่านั้น ถ้าตั้ง security_invoker
-- = true จะทำให้ view รัน RLS ตามสิทธิ์ผู้เรียก (เห็นแค่แถวตัวเอง) ซึ่งไม่ตรงจุดประสงค์เลย
-- ค่า default (security_invoker = false) จะรัน query ในนามเจ้าของ view (ปกติคือ postgres/
-- ผู้สร้างตาราง) ซึ่งเห็นข้อมูลได้ครบ แล้วค่อยกรองให้เหลือแค่คอลัมน์ปลอดภัยผ่าน SELECT list นี่แหละ
CREATE VIEW PublicUserProfile AS
  SELECT user_id, username, firstname, status
  FROM UserAccount;

-- ต้อง GRANT สิทธิ์ SELECT ให้ view นี้ชัดๆ ไม่งั้น anon/authenticated role อาจเรียกไม่ได้
GRANT SELECT ON PublicUserProfile TO anon, authenticated;


-- ============================================================================
-- ★ TRIGGER — สร้างแถว UserAccount อัตโนมัติทันทีที่มีคนสมัครผ่าน Supabase Auth
-- (เรียก supabase.auth.signUp() จากฝั่ง frontend) ป้องกันปัญหา "auth.users มีแถว
-- แต่ public.UserAccount ไม่มีแถวคู่กัน" ซึ่งจะทำให้ RLS ทุกจุดพังเพราะหา user_id ไม่เจอ
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role_type TEXT;
  v_role_id   UUID;
BEGIN
  INSERT INTO UserAccount (user_id, username, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'Pending_Verification'
  );

  -- ถ้าตอนสมัครส่ง role มาด้วย (ผ่าน options.data ตอนเรียก supabase.auth.signUp เช่น
  -- { data: { signup_role: 'renter' } }) ให้ assign role นั้นให้เลยในทีเดียวกัน
  -- (admin assign เองไม่ได้ผ่านทางนี้ ต้องให้ admin คนอื่นเพิ่มให้ผ่าน User_Role_Assignment เท่านั้น)
  v_role_type := NEW.raw_user_meta_data->>'signup_role';
  IF v_role_type IN ('renter', 'lender') THEN
    SELECT role_id INTO v_role_id FROM Role WHERE role_type = v_role_type;
    INSERT INTO User_Role_Assignment (user_id, role_id) VALUES (NEW.id, v_role_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- เรียกใช้จาก Frontend:
-- const { data, error } = await supabase.auth.signUp({
--   email: 'user@example.com',
--   password: '...',   -- Supabase Auth จัดการ hash ให้เองทั้งหมด ไม่ต้อง hash เอง
--   options: { data: { username: 'fanta', signup_role: 'renter' } }
-- });
-- แค่นี้ trigger ด้านบนจะสร้างแถว UserAccount + User_Role_Assignment ให้อัตโนมัติทันที


-- ============================================================================
-- 3. UserPhones — ข้อมูลส่วนตัว เจ้าของ + admin เท่านั้น
-- ============================================================================
ALTER TABLE UserPhones ENABLE ROW LEVEL SECURITY;
CREATE POLICY userphones_all_own_or_admin ON UserPhones
  FOR ALL USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());


-- ============================================================================
-- 4. BankAccount — ข้อมูลอ่อนไหวมาก เจ้าของ + admin เท่านั้น
-- ============================================================================
ALTER TABLE BankAccount ENABLE ROW LEVEL SECURITY;
CREATE POLICY bankaccount_all_own_or_admin ON BankAccount
  FOR ALL USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());


-- ============================================================================
-- 5. User_Role_Assignment
-- ผู้ใช้ตั้งตัวเองเป็น renter/lender ได้ตอนสมัคร แต่ตั้งตัวเองเป็น admin ไม่ได้เด็ดขาด
-- ============================================================================
ALTER TABLE User_Role_Assignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY roleassign_select_own_or_admin ON User_Role_Assignment
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY roleassign_insert_self_non_admin ON User_Role_Assignment
  FOR INSERT WITH CHECK (
    is_admin()
    OR (
      user_id = auth.uid()
      AND role_id IN (SELECT role_id FROM Role WHERE role_type IN ('renter', 'lender'))
    )
  );

CREATE POLICY roleassign_delete_admin_only ON User_Role_Assignment
  FOR DELETE USING (is_admin());


-- ============================================================================
-- 6. ItemCategory — อ่านได้ทุกคน (รวม anon เพื่อ browse ได้โดยไม่ต้อง login) แก้ไขได้แค่ admin
-- ============================================================================
ALTER TABLE ItemCategory ENABLE ROW LEVEL SECURITY;
CREATE POLICY itemcategory_select_all ON ItemCategory FOR SELECT USING (true);
CREATE POLICY itemcategory_write_admin ON ItemCategory
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ============================================================================
-- 7. Item — สินค้าที่ status='available' เปิดให้ทุกคนดูได้ (สำหรับ browse/ค้นหา)
-- เจ้าของเห็นสินค้าตัวเองได้ทุกสถานะ (รวม maintenance/inactive ที่คนอื่นไม่เห็น)
-- ============================================================================
ALTER TABLE Item ENABLE ROW LEVEL SECURITY;

CREATE POLICY item_select_available_or_own_or_admin ON Item
  FOR SELECT USING (status = 'available' OR user_id = auth.uid() OR is_admin());

CREATE POLICY item_insert_own ON Item
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY item_update_own_or_admin ON Item
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY item_delete_own_or_admin ON Item
  FOR DELETE USING (user_id = auth.uid() OR is_admin());


-- ============================================================================
-- 8. ItemCondition / ItemImage / ItemLocation / Availability
-- อ่านตามการมองเห็นของ Item แม่ (public ถ้า available, เจ้าของเห็นเสมอ)
-- แก้ไขได้เฉพาะเจ้าของสินค้าเท่านั้น — ทั้ง 4 ตารางใช้ pattern เดียวกันเป๊ะ
-- ============================================================================
ALTER TABLE ItemCondition ENABLE ROW LEVEL SECURITY;
CREATE POLICY itemcondition_select ON ItemCondition FOR SELECT USING (
  EXISTS (SELECT 1 FROM Item i WHERE i.item_id = ItemCondition.item_id
          AND (i.status = 'available' OR i.user_id = auth.uid() OR is_admin())));
CREATE POLICY itemcondition_write_owner ON ItemCondition
  FOR ALL USING (owns_item(item_id) OR is_admin()) WITH CHECK (owns_item(item_id) OR is_admin());

ALTER TABLE ItemImage ENABLE ROW LEVEL SECURITY;
CREATE POLICY itemimage_select ON ItemImage FOR SELECT USING (
  EXISTS (SELECT 1 FROM Item i WHERE i.item_id = ItemImage.item_id
          AND (i.status = 'available' OR i.user_id = auth.uid() OR is_admin())));
CREATE POLICY itemimage_write_owner ON ItemImage
  FOR ALL USING (owns_item(item_id) OR is_admin()) WITH CHECK (owns_item(item_id) OR is_admin());

ALTER TABLE ItemLocation ENABLE ROW LEVEL SECURITY;
CREATE POLICY itemlocation_select ON ItemLocation FOR SELECT USING (
  EXISTS (SELECT 1 FROM Item i WHERE i.item_id = ItemLocation.item_id
          AND (i.status = 'available' OR i.user_id = auth.uid() OR is_admin())));
CREATE POLICY itemlocation_write_owner ON ItemLocation
  FOR ALL USING (owns_item(item_id) OR is_admin()) WITH CHECK (owns_item(item_id) OR is_admin());

ALTER TABLE Availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_select ON Availability FOR SELECT USING (
  EXISTS (SELECT 1 FROM Item i WHERE i.item_id = Availability.item_id
          AND (i.status = 'available' OR i.user_id = auth.uid() OR is_admin())));
CREATE POLICY availability_write_owner ON Availability
  FOR ALL USING (owns_item(item_id) OR is_admin()) WITH CHECK (owns_item(item_id) OR is_admin());


-- ============================================================================
-- 9. RentalOrder
-- SELECT: ผู้เช่า หรือ เจ้าของสินค้า (lender) หรือ admin เท่านั้น
-- INSERT: ผู้เช่าสร้างคำขอเช่าของตัวเองเท่านั้น
-- UPDATE: ★ ไม่เปิดให้ผู้ใช้ทั่วไป UPDATE ตรงๆ เลย — บังคับให้การเปลี่ยนสถานะทุกจุด
--   ต้องผ่าน business logic function (SECURITY DEFINER) ในไฟล์ 03 เท่านั้น
--   เพื่อคุมกฎการเปลี่ยนสถานะให้ถูกต้องอยู่จุดเดียว ไม่ให้ client เปลี่ยนสถานะมั่วเอง
--   (เช่น ป้องกันไม่ให้ผู้เช่า UPDATE status เป็น 'completed' เองโดยไม่ผ่านขั้นตอนตรวจสอบ)
-- ============================================================================
ALTER TABLE RentalOrder ENABLE ROW LEVEL SECURITY;

CREATE POLICY rentalorder_select_participant_or_admin ON RentalOrder
  FOR SELECT USING (user_id = auth.uid() OR owns_item(item_id) OR is_admin());

CREATE POLICY rentalorder_insert_renter ON RentalOrder
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY rentalorder_update_admin_only ON RentalOrder
  FOR UPDATE USING (is_admin());


-- ============================================================================
-- 10. Payment — เงินเป็นข้อมูลอ่อนไหวสุด เปิดแค่ SELECT ให้ participant เห็นประวัติ
-- ไม่เปิด INSERT/UPDATE ให้ client โดยตรงเลย ต้องผ่าน function เท่านั้น (settle_rental_order ฯลฯ)
-- ============================================================================
ALTER TABLE Payment ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_select_participant_or_admin ON Payment
  FOR SELECT USING (user_id = auth.uid() OR is_order_participant(order_id) OR is_admin());


-- ============================================================================
-- 11. RentalEvidenceImage — participant ของ order เท่านั้น อัปโหลดได้แค่ของตัวเอง
-- ============================================================================
ALTER TABLE RentalEvidenceImage ENABLE ROW LEVEL SECURITY;
CREATE POLICY evidence_select_participant_or_admin ON RentalEvidenceImage
  FOR SELECT USING (is_order_participant(order_id) OR is_admin());
CREATE POLICY evidence_insert_self ON RentalEvidenceImage
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_order_participant(order_id));


-- ============================================================================
-- 12. Review — อ่านได้ทุกคน (ช่วยตัดสินใจก่อนเช่า) เขียนได้แค่ผู้เช่าหลัง order เสร็จแล้ว
-- ============================================================================
ALTER TABLE Review ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_select_all ON Review FOR SELECT USING (true);
CREATE POLICY review_insert_renter_after_completed ON Review
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM RentalOrder ro
            WHERE ro.order_id = Review.order_id AND ro.user_id = auth.uid() AND ro.status = 'completed')
  );
CREATE POLICY review_update_own_or_admin ON Review
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM RentalOrder ro WHERE ro.order_id = Review.order_id AND ro.user_id = auth.uid())
    OR is_admin()
  );


-- ============================================================================
-- 13. ReviewImage — อ่านสาธารณะตาม Review แม่ เขียนได้แค่เจ้าของรีวิว
-- ============================================================================
ALTER TABLE ReviewImage ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviewimage_select_all ON ReviewImage FOR SELECT USING (true);
CREATE POLICY reviewimage_write_owner ON ReviewImage
  FOR ALL USING (
    EXISTS (SELECT 1 FROM Review rv JOIN RentalOrder ro ON ro.order_id = rv.order_id
            WHERE rv.review_id = ReviewImage.review_id AND ro.user_id = auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM Review rv JOIN RentalOrder ro ON ro.order_id = rv.order_id
            WHERE rv.review_id = ReviewImage.review_id AND ro.user_id = auth.uid())
    OR is_admin()
  );


-- ============================================================================
-- 14. RentalReportType — อ่านได้ทุกคน แก้ไขได้แค่ admin
-- ============================================================================
ALTER TABLE RentalReportType ENABLE ROW LEVEL SECURITY;
CREATE POLICY reporttype_select_all ON RentalReportType FOR SELECT USING (true);
CREATE POLICY reporttype_write_admin ON RentalReportType
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ============================================================================
-- 15. RentalReport — participant ของ order + admin เท่านั้น
-- UPDATE (ตัดสินข้อพิพาท) ทำได้แค่ admin ผ่าน resolve_dispute() เท่านั้น
-- ============================================================================
ALTER TABLE RentalReport ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_select_participant_or_admin ON RentalReport
  FOR SELECT USING (user_id = auth.uid() OR is_order_participant(order_id) OR is_admin());
CREATE POLICY report_insert_self ON RentalReport
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_order_participant(order_id));
CREATE POLICY report_update_admin_only ON RentalReport
  FOR UPDATE USING (is_admin());


-- ============================================================================
-- 16. RentalReportImage — ตาม RentalReport แม่
-- ============================================================================
ALTER TABLE RentalReportImage ENABLE ROW LEVEL SECURITY;
CREATE POLICY reportimage_select ON RentalReportImage FOR SELECT USING (
  EXISTS (SELECT 1 FROM RentalReport rr WHERE rr.report_id = RentalReportImage.report_id
          AND (rr.user_id = auth.uid() OR is_order_participant(rr.order_id) OR is_admin())));
CREATE POLICY reportimage_insert_self ON RentalReportImage FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM RentalReport rr WHERE rr.report_id = RentalReportImage.report_id
          AND rr.user_id = auth.uid()));


-- ============================================================================
-- 17. ChatRoom — เห็นได้เฉพาะคู่สนทนา (renter/lender) หรือ admin
-- ============================================================================
ALTER TABLE ChatRoom ENABLE ROW LEVEL SECURITY;
CREATE POLICY chatroom_select_participant_or_admin ON ChatRoom
  FOR SELECT USING (renter_id = auth.uid() OR lender_id = auth.uid() OR is_admin());
CREATE POLICY chatroom_insert_participant ON ChatRoom
  FOR INSERT WITH CHECK (renter_id = auth.uid() OR lender_id = auth.uid());


-- ============================================================================
-- 18. Message — เห็น/ส่งได้เฉพาะคนในห้องแชทนั้น
-- ============================================================================
ALTER TABLE Message ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_select_participant_or_admin ON Message
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ChatRoom cr WHERE cr.chat_room_id = Message.chat_room_id
            AND (cr.renter_id = auth.uid() OR cr.lender_id = auth.uid()))
    OR is_admin()
  );
CREATE POLICY message_insert_participant ON Message
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM ChatRoom cr WHERE cr.chat_room_id = Message.chat_room_id
                AND (cr.renter_id = auth.uid() OR cr.lender_id = auth.uid()))
  );
CREATE POLICY message_update_mark_read ON Message
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ChatRoom cr WHERE cr.chat_room_id = Message.chat_room_id
            AND (cr.renter_id = auth.uid() OR cr.lender_id = auth.uid()))
  );
