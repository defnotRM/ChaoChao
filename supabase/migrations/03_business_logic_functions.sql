-- ============================================================================
-- CHAOCHAO — BUSINESS LOGIC FUNCTIONS (RPC)
-- ครอบคลุมอีก 6 flow ที่เหลือจาก 02_example_transactions.sql
-- เขียนเป็น PL/pgSQL FUNCTION แทน raw BEGIN/COMMIT เพราะ:
--   1. เรียกจาก Supabase JS ได้ตรงๆ ผ่าน supabase.rpc('ชื่อฟังก์ชัน', {...})
--   2. โค้ดข้างในฟังก์ชันรันอยู่ใน transaction เดียวกันโดยอัตโนมัติ (atomic)
--      ไม่ต้องเขียน BEGIN/COMMIT/ROLLBACK เอง ถ้ามีบรรทัดไหน error กลางทาง
--      ทุกอย่างที่ INSERT/UPDATE ไปก่อนหน้าในฟังก์ชันเดียวกันจะถูกยกเลิกทั้งหมด
-- ============================================================================


-- ----------------------------------------------------------------------------
-- หมายเหตุ: ระหว่างออกแบบ flow คืนเงินประกันด้านล่าง เจอว่า schema เดิมยังไม่พอ 2 จุด
--   1. Payment ไม่มีคอลัมน์เก็บ "จำนวนเงิน"
--   2. RentalOrder.status ไม่มีค่ารองรับเคส "มัดจำไม่พอจ่ายค่าเสียหาย ต้องรอจ่ายเพิ่ม"
-- ทั้งสองจุดนี้ถูกรวมเข้าไปอยู่ใน 01_schema.sql โดยตรงแล้ว (ไม่ต้องรัน ALTER ซ้ำที่นี่)
-- ถ้ารัน 01_schema.sql เวอร์ชันล่าสุดไปแล้ว ไฟล์นี้ใช้ได้เลยไม่ต้องทำอะไรเพิ่ม
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 4. ลงประกาศสินค้า (UC-05)
-- สร้าง Item + รูปหลายรูป + จุดรับหลายจุด + ช่วงวันว่าง + เงื่อนไขหลายข้อ พร้อมกัน
-- ถ้ารูปใดรูปหนึ่ง insert พลาด (เช่น URL ผิดรูปแบบ) จะไม่มี Item ค้างแบบข้อมูลไม่ครบ
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_item_listing(
  p_user_id            UUID,
  p_category_id        UUID,
  p_item_name          TEXT,
  p_description        TEXT,
  p_original_price     NUMERIC,
  p_rental_fee_per_day NUMERIC,
  p_deposit            NUMERIC,
  p_images             JSONB,   -- [{"image_url":"...", "is_primary":true, "sequence":1}, ...]
  p_locations          JSONB,   -- [{"description":"...", "no":"...", "alley":"...", "road":"...",
                                 --   "subdistrict":"...", "district":"...", "province":"..."}, ...]
  p_availability_start DATE,
  p_availability_end   DATE,
  p_conditions         TEXT[]   -- ['คืนตรงเวลานัด', 'ห้ามใช้ในที่เปียกชื้น', ...] ลำดับ = seq
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item_id UUID;
  v_img     JSONB;
  v_loc     JSONB;
  v_cond    TEXT;
  v_seq     INTEGER := 1;
BEGIN
  -- กันไม่ให้ใครลงประกาศสินค้าแทนคนอื่น (ต้องเป็นเจ้าของบัญชีที่ล็อกอินอยู่จริงเท่านั้น)
  IF p_user_id <> auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์ลงประกาศสินค้าแทนผู้ใช้คนอื่น';
  END IF;

  INSERT INTO Item (user_id, category_id, item_name, description,
                     original_price, rental_fee_per_day, deposit, status)
  VALUES (p_user_id, p_category_id, p_item_name, p_description,
          p_original_price, p_rental_fee_per_day, p_deposit, 'available')
  RETURNING item_id INTO v_item_id;

  FOR v_img IN SELECT * FROM jsonb_array_elements(p_images) LOOP
    INSERT INTO ItemImage (item_id, image_url, is_primary, sequence)
    VALUES (v_item_id, v_img->>'image_url',
            COALESCE((v_img->>'is_primary')::boolean, false),
            (v_img->>'sequence')::integer);
  END LOOP;

  FOR v_loc IN SELECT * FROM jsonb_array_elements(p_locations) LOOP
    INSERT INTO ItemLocation (item_id, description, no, alley, road, subdistrict, district, province)
    VALUES (v_item_id, v_loc->>'description', v_loc->>'no', v_loc->>'alley', v_loc->>'road',
            v_loc->>'subdistrict', v_loc->>'district', v_loc->>'province');
  END LOOP;

  INSERT INTO Availability (item_id, start_date, end_date)
  VALUES (v_item_id, p_availability_start, p_availability_end);

  FOREACH v_cond IN ARRAY p_conditions LOOP
    INSERT INTO ItemCondition (item_id, seq, condition) VALUES (v_item_id, v_seq, v_cond);
    v_seq := v_seq + 1;
  END LOOP;

  RETURN v_item_id;
END;
$$;

-- เรียกใช้จาก Supabase JS:
-- const { data, error } = await supabase.rpc('create_item_listing', {
--   p_user_id: '...', p_category_id: '...', p_item_name: 'กล้อง Sony A7 III', ...
--   p_images: [{image_url:'...', is_primary:true, sequence:1}],
--   p_conditions: ['คืนตรงเวลานัด', 'ห้ามใช้ในที่เปียกชื้น']
-- });


-- ----------------------------------------------------------------------------
-- 5. อัปโหลดหลักฐานส่งมอบ/รับคืนสินค้า (ใช้ได้ทั้งตอนส่งมอบและตอนคืน)
-- INSERT รูปหลักฐานหลายรูป + เปลี่ยนสถานะ order พร้อมกัน (ถ้าระบุ new_status มา)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION upload_rental_evidence(
  p_order_id      UUID,
  p_user_id       UUID,
  p_evidence_type TEXT,          -- 'renter_before' | 'renter_after' | 'lender_before' | 'lender_after'
  p_image_urls    TEXT[],
  p_new_status    TEXT DEFAULT NULL   -- ใส่เมื่อต้องการเปลี่ยนสถานะ order ไปพร้อมกัน เช่น 'item_sent'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url TEXT;
BEGIN
  -- ต้องเป็น participant ของ order นี้จริง (ผู้เช่าหรือผู้ให้เช่าของ order นั้น) และอัปโหลด
  -- ในนามตัวเองเท่านั้น ห้ามสวมรอยอัปโหลดแทนอีกฝ่าย
  IF p_user_id <> auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์อัปโหลดหลักฐานแทนผู้ใช้คนอื่น';
  END IF;
  IF NOT is_order_participant(p_order_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'ไม่ใช่ผู้เกี่ยวข้องกับ order นี้';
  END IF;

  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO RentalEvidenceImage (order_id, user_id, evidence_type, image_url)
    VALUES (p_order_id, p_user_id, p_evidence_type, v_url);
  END LOOP;

  IF p_new_status IS NOT NULL THEN
    UPDATE RentalOrder SET status = p_new_status WHERE order_id = p_order_id;
  END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- 6. คืนเงินประกัน / ปิดการเช่า (ซับซ้อนสุด — มี 3 branch ตาม Sequence Diagram)
-- เรียกโดยผู้ให้เช่าหลังตรวจสอบสภาพสินค้าที่คืนมา พร้อมระบุค่าเสียหาย (ถ้ามี)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION settle_rental_order(
  p_order_id    UUID,
  p_damage_cost NUMERIC DEFAULT 0   -- 0 = ไม่มีความเสียหาย
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deposit         NUMERIC;
  v_net_income      NUMERIC;
  v_renter_id       UUID;
  v_item_id         UUID;
  v_refund_amount   NUMERIC;
  v_extra_needed    NUMERIC;
BEGIN
  -- ล็อกแถวไว้ก่อน กันผู้ให้เช่ากดปิดออเดอร์ซ้ำ 2 ครั้งพร้อมกัน
  SELECT deposit, net_income, user_id, item_id
  INTO v_deposit, v_net_income, v_renter_id, v_item_id
  FROM RentalOrder
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ไม่พบ order: %', p_order_id;
  END IF;

  -- เฉพาะเจ้าของสินค้า (ผู้ให้เช่าของ order นี้) หรือ admin เท่านั้นที่ตัดสินค่าเสียหายได้
  IF NOT owns_item(v_item_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'เฉพาะผู้ให้เช่าของ order นี้เท่านั้นที่ปิดการเช่าได้';
  END IF;

  IF p_damage_cost = 0 THEN
    -- กรณี 1: ไม่มีความเสียหาย — คืนมัดจำเต็ม + จ่ายค่าเช่าให้ผู้ให้เช่า + ปิดออเดอร์
    v_refund_amount := v_deposit;

    INSERT INTO Payment (order_id, user_id, amount, status)
    VALUES (p_order_id, v_renter_id, v_refund_amount, 'refunded');

    UPDATE RentalOrder SET status = 'completed', return_at = NOW() WHERE order_id = p_order_id;

    -- TODO: เรียก Payment Gateway จริงตรงนี้ เพื่อโอน v_refund_amount คืนผู้เช่า
    --       และโอน v_net_income ให้ผู้ให้เช่า — DB เก็บแค่ผลลัพธ์ ไม่ได้ยิง API เอง
    RETURN 'completed_no_damage';

  ELSIF p_damage_cost <= v_deposit THEN
    -- กรณี 2: เสียหายแต่มัดจำพอจ่าย — หักจากมัดจำ ที่เหลือคืนผู้เช่า
    v_refund_amount := v_deposit - p_damage_cost;

    INSERT INTO Payment (order_id, user_id, amount, status)
    VALUES (p_order_id, v_renter_id, v_refund_amount, 'refunded');

    UPDATE RentalOrder SET status = 'completed', return_at = NOW() WHERE order_id = p_order_id;

    -- TODO: โอน v_refund_amount คืนผู้เช่า + โอน v_net_income ให้ผู้ให้เช่า
    RETURN 'completed_deposit_covers_damage';

  ELSE
    -- กรณี 3: มัดจำไม่พอจ่ายค่าเสียหาย — ต้องรอผู้เช่าจ่ายเพิ่ม ยังปิดออเดอร์ไม่ได้
    -- (ถ้าผู้เช่าไม่ยินยอมจ่าย ให้ไปเข้า flow submit_report / resolve_dispute แทน)
    v_extra_needed := p_damage_cost - v_deposit;

    UPDATE RentalOrder SET status = 'awaiting_additional_payment' WHERE order_id = p_order_id;

    INSERT INTO Payment (order_id, user_id, amount, status)
    VALUES (p_order_id, v_renter_id, v_extra_needed, 'pending');

    RETURN 'awaiting_additional_payment:' || v_extra_needed::TEXT;
  END IF;
END;
$$;

-- เมื่อผู้เช่าจ่ายส่วนเพิ่มสำเร็จ (กรณี 3) ให้เรียกฟังก์ชันนี้ต่อเพื่อปิดออเดอร์จริง:
CREATE OR REPLACE FUNCTION confirm_additional_payment(p_payment_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- ฟังก์ชันนี้ควรถูกเรียกจาก Payment Gateway webhook (ผ่าน service_role) หรือ admin เท่านั้น
  -- ไม่ควรให้ผู้เช่าเรียกเองมั่วๆ เพราะเป็นการยืนยันว่า "เงินเข้าจริง" ซึ่งต้องมาจากแหล่งที่เชื่อถือได้
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'เฉพาะระบบชำระเงินหรือแอดมินเท่านั้นที่ยืนยันการจ่ายเพิ่มได้';
  END IF;

  UPDATE Payment SET status = 'paid' WHERE payment_id = p_payment_id
  RETURNING order_id INTO v_order_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'ไม่พบ payment: %', p_payment_id;
  END IF;

  UPDATE RentalOrder SET status = 'completed' WHERE order_id = v_order_id;
END;
$$;


-- ----------------------------------------------------------------------------
-- 7. จัดการข้อพิพาท (UC-08) — แอดมินตัดสินหลังตรวจสอบหลักฐาน
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_report_id UUID,
  p_outcome   TEXT   -- 'refund_renter_full' | 'award_deposit_to_lender'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id  UUID;
  v_renter_id UUID;
  v_deposit   NUMERIC;
BEGIN
  -- ตัดสินข้อพิพาทได้เฉพาะแอดมินเท่านั้น (ตรงกับ UC-08)
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'เฉพาะแอดมินเท่านั้นที่ตัดสินข้อพิพาทได้';
  END IF;

  SELECT r.order_id, ro.user_id, ro.deposit
  INTO v_order_id, v_renter_id, v_deposit
  FROM RentalReport r
  JOIN RentalOrder ro ON ro.order_id = r.order_id
  WHERE r.report_id = p_report_id
  FOR UPDATE;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'ไม่พบรายงาน: %', p_report_id;
  END IF;

  IF p_outcome NOT IN ('refund_renter_full', 'award_deposit_to_lender') THEN
    RAISE EXCEPTION 'ค่า outcome ไม่ถูกต้อง: %', p_outcome;
  END IF;

  UPDATE RentalReport SET status = 'resolved', resolved_at = NOW() WHERE report_id = p_report_id;
  UPDATE RentalOrder SET status = 'completed', return_at = NOW() WHERE order_id = v_order_id;

  IF p_outcome = 'refund_renter_full' THEN
    INSERT INTO Payment (order_id, user_id, amount, status)
    VALUES (v_order_id, v_renter_id, v_deposit, 'refunded');
    -- TODO: เรียก Payment Gateway คืนเงินทั้งหมดให้ผู้เช่า ไม่จ่ายผู้ให้เช่า
  ELSE
    -- award_deposit_to_lender: มัดจำทั้งหมดตกเป็นของผู้ให้เช่า ไม่ต้อง INSERT Payment คืนผู้เช่า
    -- TODO: เรียก Payment Gateway โอนมัดจำให้ผู้ให้เช่า
    NULL;
  END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- 8. เขียนรีวิว (UC-09)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION submit_review(
  p_order_id    UUID,
  p_rating      INTEGER,
  p_comment     TEXT,
  p_image_urls  TEXT[] DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_review_id UUID;
  v_url       TEXT;
  v_seq       INTEGER := 1;
BEGIN
  -- ต้องเป็นผู้เช่าของ order นี้จริง และ order ต้องเสร็จสมบูรณ์แล้วเท่านั้นถึงรีวิวได้
  IF NOT EXISTS (
    SELECT 1 FROM RentalOrder
    WHERE order_id = p_order_id AND user_id = auth.uid() AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'รีวิวได้เฉพาะ order ที่เสร็จสมบูรณ์แล้วและเป็นของคุณเท่านั้น';
  END IF;

  -- ไม่ต้องเช็คเองว่ารีวิวซ้ำไหม เพราะ Review มี UNIQUE(order_id) บังคับไว้ที่ตารางแล้ว
  -- ถ้า order นี้เคยรีวิวไปแล้ว บรรทัดถัดไปจะ error ให้เองอัตโนมัติ
  INSERT INTO Review (order_id, rating, comment)
  VALUES (p_order_id, p_rating, p_comment)
  RETURNING review_id INTO v_review_id;

  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO ReviewImage (review_id, image_url, sequence) VALUES (v_review_id, v_url, v_seq);
    v_seq := v_seq + 1;
  END LOOP;

  RETURN v_review_id;
END;
$$;


-- ----------------------------------------------------------------------------
-- 9. รายงานปัญหา (UC-10)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION submit_report(
  p_report_type_id UUID,
  p_user_id        UUID,
  p_order_id       UUID,
  p_report_topic   TEXT,
  p_description    TEXT,
  p_image_urls     TEXT[] DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_report_id UUID;
  v_url       TEXT;
BEGIN
  -- ต้องรายงานในนามตัวเอง และต้องเป็น participant ของ order นั้นจริง
  IF p_user_id <> auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์รายงานปัญหาแทนผู้ใช้คนอื่น';
  END IF;
  IF NOT is_order_participant(p_order_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'ไม่ใช่ผู้เกี่ยวข้องกับ order นี้';
  END IF;

  INSERT INTO RentalReport (report_type_id, user_id, order_id, report_topic, description, status)
  VALUES (p_report_type_id, p_user_id, p_order_id, p_report_topic, p_description, 'pending_investigation')
  RETURNING report_id INTO v_report_id;

  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO RentalReportImage (report_id, image_url) VALUES (v_report_id, v_url);
  END LOOP;

  RETURN v_report_id;
END;
$$;
