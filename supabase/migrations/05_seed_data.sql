-- ============================================================================
-- CHAOCHAO — MOCK / SEED DATA (สำหรับทดสอบ schema เท่านั้น)
-- รันหลังจาก 01 → 04 → 03 เรียบร้อยแล้วเท่านั้น
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ★ ทำไมต้อง insert auth.users ก่อน แทนที่จะ insert UserAccount ตรงๆ
-- เพราะไฟล์ 04 ผูก UserAccount.user_id ให้อ้างอิง auth.users(id) ไว้แล้ว (FK)
-- ถ้า insert UserAccount ตรงๆ ด้วย UUID ที่ไม่มีอยู่ใน auth.users จะโดน FK error ทันที
-- วิธีที่ถูกต้องคือ insert auth.users ก่อน แล้ว trigger on_auth_user_created (ในไฟล์ 04)
-- จะสร้างแถว UserAccount + assign role ให้อัตโนมัติ
-- ----------------------------------------------------------------------------

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'fanta@example.com', crypt('password123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"fanta","signup_role":"lender"}', NOW(), NOW(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'mint@example.com', crypt('password123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"mint","signup_role":"renter"}', NOW(), NOW(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a3333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'guy@example.com', crypt('password123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"guy","signup_role":"lender"}', NOW(), NOW(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a4444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'ploy@example.com', crypt('password123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"ploy","signup_role":"renter"}', NOW(), NOW(), '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a5555555-5555-5555-5555-555555555555',
   'authenticated', 'authenticated', 'admin@example.com', crypt('password123', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"admin_user"}', NOW(), NOW(), '', '');

-- ตอนนี้ trigger สร้าง UserAccount ให้ 5 คนแล้ว (fanta, guy เป็น lender / mint, ploy เป็น renter
-- / admin_user ยังไม่มี role เพราะ trigger assign ได้แค่ renter/lender เท่านั้น)

-- ตั้ง guy ให้เป็นทั้ง renter และ lender พร้อมกัน (ทดสอบ M:N จริง)
INSERT INTO User_Role_Assignment (user_id, role_id)
SELECT 'a3333333-3333-3333-3333-333333333333', role_id FROM Role WHERE role_type = 'renter';

-- ตั้ง admin_user ให้เป็น admin (ต้อง insert เองเพราะ trigger ไม่ auto-assign admin ให้ใคร)
INSERT INTO User_Role_Assignment (user_id, role_id)
SELECT 'a5555555-5555-5555-5555-555555555555', role_id FROM Role WHERE role_type = 'admin';

-- อัปเดตให้ทุกคน (ยกเว้น admin) ผ่านการยืนยันตัวตนแล้ว + เติม national_id ปลอม
UPDATE UserAccount SET status = 'Active', national_id = '1' || LPAD(sub.rn::TEXT, 12, '0')
FROM (SELECT user_id, row_number() OVER () AS rn FROM UserAccount) sub
WHERE UserAccount.user_id = sub.user_id;

-- เบอร์โทร (multi-value attribute)
INSERT INTO UserPhones (user_id, phone) VALUES
  ('a1111111-1111-1111-1111-111111111111', '0812345678'),
  ('a2222222-2222-2222-2222-222222222222', '0898765432'),
  ('a3333333-3333-3333-3333-333333333333', '0865551234');

-- บัญชีธนาคาร (เฉพาะ lender ที่ต้องรับเงิน)
INSERT INTO BankAccount (user_id, bank_name, account_number, account_name, is_default) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'กสิกรไทย', '123-4-56789-0', 'นายฟ้า ตาสว่าง', true),
  ('a3333333-3333-3333-3333-333333333333', 'ไทยพาณิชย์', '987-6-54321-0', 'นายกาย ดีใจ', true);


-- ============================================================================
-- หมวดหมู่สินค้า + สินค้า 5 ชิ้น
-- ============================================================================
INSERT INTO ItemCategory (category_id, category_name) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'อุปกรณ์ถ่ายภาพ'),
  ('c2222222-2222-2222-2222-222222222222', 'อุปกรณ์แคมป์ปิ้ง'),
  ('c3333333-3333-3333-3333-333333333333', 'เครื่องมือช่าง');

INSERT INTO Item (item_id, user_id, category_id, item_name, description, original_price, rental_fee_per_day, deposit, status) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
   'กล้อง Sony A7 III พร้อมเลนส์ 24-70mm', 'กล้อง Full-frame ยอดนิยม พร้อมแบตเตอรี่ 2 ก้อนและการ์ด SD', 65000, 890, 15000, 'rented'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
   'เลนส์ Canon 50mm f/1.8', 'เลนส์ portrait หน้าชัดหลังเบลอ เหมาะกับงานถ่ายคน', 18000, 350, 5000, 'available'),
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111',
   'ไฟสตูดิโอ LED พร้อมขาตั้ง', 'ไฟถ่ายภาพปรับความสว่างได้ พร้อม softbox', 12000, 450, 3000, 'rented'),
  ('b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222',
   'เต็นท์แคมป์ปิ้ง 4 คน', 'กันน้ำ 100% ตั้งง่ายคนเดียวได้ใน 5 นาที', 8000, 300, 2000, 'available'),
  ('b5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333',
   'สว่านไฟฟ้าไร้สาย', 'พร้อมดอกสว่าน 20 ขนาด แบตเตอรี่ลิเธียมชาร์จเร็ว', 3500, 150, 1000, 'available');

-- รูปสินค้า (อย่างน้อยชิ้นละ 1 รูป เป็นรูปปก)
INSERT INTO ItemImage (item_id, image_url, is_primary, sequence) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/camera1/800/600', true, 1),
  ('b2222222-2222-2222-2222-222222222222', 'https://picsum.photos/seed/lens1/800/600', true, 1),
  ('b3333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/light1/800/600', true, 1),
  ('b4444444-4444-4444-4444-444444444444', 'https://picsum.photos/seed/tent1/800/600', true, 1),
  ('b5555555-5555-5555-5555-555555555555', 'https://picsum.photos/seed/drill1/800/600', true, 1);

-- จุดนัดรับ-คืน
INSERT INTO ItemLocation (item_id, description, subdistrict, district, province) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'BTS อโศก', 'คลองเตยเหนือ', 'วัฒนา', 'กรุงเทพมหานคร'),
  ('b2222222-2222-2222-2222-222222222222', 'BTS อโศก', 'คลองเตยเหนือ', 'วัฒนา', 'กรุงเทพมหานคร'),
  ('b3333333-3333-3333-3333-333333333333', 'MRT ลาดพร้าว', 'จันทรเกษม', 'จตุจักร', 'กรุงเทพมหานคร'),
  ('b4444444-4444-4444-4444-444444444444', 'MRT ลาดพร้าว', 'จันทรเกษม', 'จตุจักร', 'กรุงเทพมหานคร'),
  ('b5555555-5555-5555-5555-555555555555', 'BTS อโศก', 'คลองเตยเหนือ', 'วัฒนา', 'กรุงเทพมหานคร');

-- ช่วงวันที่เปิดให้เช่า
INSERT INTO Availability (item_id, start_date, end_date) VALUES
  ('b1111111-1111-1111-1111-111111111111', '2026-08-01', '2026-09-30'),
  ('b2222222-2222-2222-2222-222222222222', '2026-08-01', '2026-09-30'),
  ('b3333333-3333-3333-3333-333333333333', '2026-08-01', '2026-09-30'),
  ('b4444444-4444-4444-4444-444444444444', '2026-08-01', '2026-09-30'),
  ('b5555555-5555-5555-5555-555555555555', '2026-08-01', '2026-09-30');

-- เงื่อนไขการเช่า (weak entity ItemCondition — ของใครของมัน ไม่ reuse ข้ามสินค้า)
INSERT INTO ItemCondition (item_id, seq, condition) VALUES
  ('b1111111-1111-1111-1111-111111111111', 1, 'คืนอุปกรณ์ตามเวลาที่นัดหมาย'),
  ('b1111111-1111-1111-1111-111111111111', 2, 'ห้ามนำไปใช้ในที่เปียกชื้นหรือฝนตกหนัก'),
  ('b3333333-3333-3333-3333-333333333333', 1, 'กรุณาระวังหลอดไฟแตกระหว่างขนย้าย'),
  ('b4444444-4444-4444-4444-444444444444', 1, 'กรุณาทำความสะอาดก่อนคืน');


-- ============================================================================
-- คำสั่งเช่า 3 รายการ (ครบ 3 สถานะ: completed / paid / requested)
-- ============================================================================
INSERT INTO RentalOrder (order_id, user_id, item_id, meetup_location, return_location,
                          start_date, end_date, return_at, rental_fee, deposit, total_paid, fee, net_income, status) VALUES
  -- mint เช่ากล้องจาก fanta เสร็จสมบูรณ์แล้ว
  ('d1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   'BTS อโศก', 'BTS อโศก', '2026-07-20', '2026-07-23', '2026-07-23 18:00:00+07',
   2670, 15000, 17670, 534, 2136, 'completed'),
  -- ploy เช่าไฟสตูดิโอจาก guy กำลังดำเนินการอยู่ (จ่ายเงินแล้ว)
  ('d2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333',
   'MRT ลาดพร้าว', 'MRT ลาดพร้าว', '2026-08-05', '2026-08-10', NULL,
   2250, 3000, 5250, 450, 1800, 'paid'),
  -- guy (เป็น renter คราวนี้) เช่าเลนส์จาก fanta ยังรออนุมัติ — ยังไม่คำนวณ fee/net_income
  ('d3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
   'BTS อโศก', 'BTS อโศก', '2026-08-15', '2026-08-17', NULL,
   700, 5000, NULL, NULL, NULL, 'requested');

-- การชำระเงิน (เฉพาะ order ที่จ่ายแล้ว)
INSERT INTO Payment (order_id, user_id, amount, slip_image_url, status) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 17670, 'https://picsum.photos/seed/slip1/400/600', 'paid'),
  ('d2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 5250, 'https://picsum.photos/seed/slip2/400/600', 'paid');

-- รูปหลักฐานก่อน-หลัง (เฉพาะ order ที่เสร็จแล้ว)
INSERT INTO RentalEvidenceImage (order_id, user_id, evidence_type, image_url) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'renter_before', 'https://picsum.photos/seed/ev1/600/400'),
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'lender_after', 'https://picsum.photos/seed/ev2/600/400');

-- รีวิว (เฉพาะ order ที่ completed แล้วเท่านั้น ตามกฎ)
INSERT INTO Review (order_id, rating, comment) VALUES
  ('d1111111-1111-1111-1111-111111111111', 5, 'กล้องสภาพดีมาก เจ้าของนัดหมายตรงเวลา แนะนำเลยครับ');


-- ============================================================================
-- ห้องแชท + ข้อความ
-- ============================================================================
INSERT INTO ChatRoom (chat_room_id, renter_id, lender_id, last_message) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111',
   'ได้ครับ พรุ่งนี้เจอกันตามนัดเลยครับ');

INSERT INTO Message (chat_room_id, order_id, sender_id, content) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
   'สวัสดีครับ สนใจเช่ากล้องช่วง 20-23 ก.ค. นี้ครับ ว่างไหมครับ'),
  ('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   'ได้ครับ พรุ่งนี้เจอกันตามนัดเลยครับ');

-- ตัวอย่างรายงานปัญหา 1 รายการ (เพื่อทดสอบตาราง RentalReport ครบ)
INSERT INTO RentalReport (report_type_id, user_id, order_id, report_topic, description, status)
SELECT report_type_id, 'a4444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222',
       'อุปกรณ์มาช้ากว่านัดหมาย', 'เจ้าของมาส่งของช้ากว่านัด 30 นาที', 'pending_investigation'
FROM RentalReportType WHERE report_type = 'lender_no_show';


-- ============================================================================
-- ตรวจสอบผลลัพธ์ — รันทีละ query เพื่อเช็คว่าข้อมูลครบและ relationship ถูกต้อง
-- ============================================================================

-- เช็คจำนวนแถวคร่าวๆ ทุกตารางหลัก
SELECT 'UserAccount' t, COUNT(*) FROM UserAccount
UNION ALL SELECT 'Item', COUNT(*) FROM Item
UNION ALL SELECT 'RentalOrder', COUNT(*) FROM RentalOrder
UNION ALL SELECT 'Payment', COUNT(*) FROM Payment
UNION ALL SELECT 'Review', COUNT(*) FROM Review
UNION ALL SELECT 'Message', COUNT(*) FROM Message;

-- เช็คว่า user คนเดียวมีได้หลาย role จริง (guy ควรมีทั้ง renter และ lender)
SELECT u.username, r.role_type
FROM UserAccount u
JOIN User_Role_Assignment ura ON ura.user_id = u.user_id
JOIN Role r ON r.role_id = ura.role_id
ORDER BY u.username;

-- เช็คว่า order ผูกกับสินค้าและเจ้าของถูกต้องครบ
SELECT ro.order_id, renter.username AS renter, lender.username AS lender, i.item_name, ro.status
FROM RentalOrder ro
JOIN UserAccount renter ON renter.user_id = ro.user_id
JOIN Item i ON i.item_id = ro.item_id
JOIN UserAccount lender ON lender.user_id = i.user_id;

-- ★ ทดสอบ EXCLUDE constraint กันจองซ้อน — ลองรันบรรทัดนี้เดี่ยวๆ ดู ควร error
-- (เพราะ b1111111... ถูกจองช่วง 2026-07-20 ถึง 2026-07-23 ไปแล้วในสถานะ completed
--  ลองเปลี่ยนไปจองสินค้าที่สถานะยัง active อยู่ เช่น d2222222 ในช่วงวันที่ทับกัน จะ error ทันที)
-- INSERT INTO RentalOrder (user_id, item_id, start_date, end_date, rental_fee, deposit, status)
-- VALUES ('a4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333',
--         '2026-08-07', '2026-08-09', 900, 3000, 'requested');
