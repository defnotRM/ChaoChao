-- ============================================================================
-- CHAOCHAO PLATFORM — DATABASE SCHEMA
-- สำหรับรันใน Supabase SQL Editor
-- เรียงลำดับตาราง: จากตารางแม่ไปหาตารางลูก เพื่อให้ Foreign Key อ้างอิงได้
-- ============================================================================

-- Extensions ที่ต้องใช้
-- pgcrypto: สำหรับ gen_random_uuid() (Supabase มักเปิดให้อยู่แล้ว แต่ใส่กันเหนียว)
-- btree_gist: สำหรับ EXCLUDE constraint กันการจองสินค้าชิ้นเดียวกันซ้อนวันกัน (ดูส่วนท้ายไฟล์)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- สำหรับค้นหาชื่อสินค้าแบบ fuzzy (พิมพ์เพี้ยนนิดหน่อยก็เจอ)


-- ============================================================================
-- HELPER: Trigger function สำหรับอัปเดตคอลัมน์ updated_at อัตโนมัติ
-- แทนที่จะต้องเขียน `updated_at = now()` เองทุกครั้งที่ทำ UPDATE ในโค้ด backend
-- ตารางไหนมีคอลัมน์ updated_at จะถูกผูก trigger นี้ไว้ท้ายไฟล์
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. Role — ตารางอ้างอิงบทบาท (ไม่ค่อยเปลี่ยน)
-- ============================================================================
CREATE TABLE Role (
  role_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type TEXT NOT NULL UNIQUE CHECK (role_type IN ('admin', 'renter', 'lender'))
);

-- ข้อมูลตั้งต้น: สร้าง role ทั้ง 3 แบบไว้เลย (จะได้ไม่ต้อง insert เองทุกครั้ง)
INSERT INTO Role (role_type) VALUES ('admin'), ('renter'), ('lender');


-- ============================================================================
-- 2. UserAccount — ข้อมูลตัวตนหลัก
-- หมายเหตุ: ตัด role_id ออกจากตารางนี้แล้ว เพราะ user คนเดียวมีได้หลาย role พร้อมกัน
-- (ดูตาราง User_Role_Assignment ด้านล่าง) — บัญชีนี้จะไม่ถูก hard-delete เด็ดขาด
-- ใช้ status = 'Deactivated' / 'Banned' แทนการลบจริงเสมอ
-- ไม่มีคอลัมน์ password เพราะรหัสผ่านจริงถูกเก็บและจัดการโดย Supabase Auth (auth.users)
-- อยู่แล้ว ตารางนี้เป็นแค่ "ข้อมูลโปรไฟล์" ที่ผูกกับ auth user ผ่าน user_id เท่านั้น
-- (ดู 04_rls_policies.sql ส่วน PREREQUISITE ที่ผูก user_id = auth.uid())
-- ============================================================================
CREATE TABLE UserAccount (
  user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  national_id TEXT UNIQUE,                 -- เลขบัตรประชาชน (ยืนยันตัวตนแล้วค่อยมีค่า)
  username    TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  firstname   TEXT,
  lastname    TEXT,
  status      TEXT NOT NULL DEFAULT 'Pending_Verification'
              CHECK (status IN ('Active', 'Pending_Verification', 'Suspended', 'Banned', 'Deactivated')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_useraccount_updated_at
  BEFORE UPDATE ON UserAccount
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 3. UserPhones — เบอร์โทรได้หลายเบอร์ต่อ user (multi-value attribute)
-- CASCADE: เบอร์โทรเป็นข้อมูลส่วนตัว ไม่มีความหมายถ้าไม่มีเจ้าของ
-- ============================================================================
CREATE TABLE UserPhones (
  user_id UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE CASCADE,
  phone   TEXT NOT NULL,
  PRIMARY KEY (user_id, phone)
);


-- ============================================================================
-- 4. BankAccount — แยกออกจาก UserAccount เพื่อรองรับหลายบัญชีต่อ user
-- CASCADE: ข้อมูลธนาคารเป็นข้อมูลส่วนตัว ลบตามเจ้าของได้
-- Partial unique index: บังคับให้มี is_default = true ได้แค่ 1 แถวต่อ user เท่านั้น
-- ============================================================================
CREATE TABLE BankAccount (
  bank_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE CASCADE,
  bank_name       TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  is_default      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, account_number)
);

-- กันไม่ให้ user คนเดียวมีบัญชี default มากกว่า 1 บัญชี
CREATE UNIQUE INDEX idx_bankaccount_one_default_per_user
  ON BankAccount (user_id) WHERE is_default = true;


-- ============================================================================
-- 5. User_Role_Assignment — ตารางเชื่อม M:N ระหว่าง User กับ Role
-- นี่คือแหล่งความจริงเดียว (single source of truth) ว่า user คนไหนมี role อะไรบ้าง
-- CASCADE ฝั่ง user_id: ถ้า (ในทางทฤษฎี) user ถูกลบจริง สิทธิ์ role ก็ควรหายไปด้วย
-- RESTRICT ฝั่ง role_id: ห้ามลบ Role ทิ้งถ้ายังมี user ใช้ role นั้นอยู่
-- ============================================================================
CREATE TABLE User_Role_Assignment (
  role_id     UUID NOT NULL REFERENCES Role(role_id) ON DELETE RESTRICT,
  user_id     UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)   -- user_id นำหน้า เพราะ query "หา role ของ user คนนี้" ใช้บ่อยกว่า "หา user ที่มี role นี้" มาก
);


-- ============================================================================
-- 6. ItemCategory — หมวดหมู่สินค้า
-- ============================================================================
CREATE TABLE ItemCategory (
  category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 7. Item — สินค้าที่ปล่อยเช่า
-- RESTRICT ฝั่ง user_id: ห้ามลบ UserAccount ถ้ายังมีสินค้าของเขาอยู่ในระบบ
--   (บังคับให้ backend ใช้ status='Deactivated' แทนการลบบัญชีจริง)
-- RESTRICT ฝั่ง category_id: ห้ามลบหมวดหมู่ถ้ายังมีสินค้าอยู่ในหมวดนั้น
-- ============================================================================
CREATE TABLE Item (
  item_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
  category_id         UUID REFERENCES ItemCategory(category_id) ON DELETE RESTRICT,
  item_name           TEXT NOT NULL,
  description         TEXT,
  original_price      NUMERIC(12,2) CHECK (original_price >= 0),
  rental_fee_per_day  NUMERIC(12,2) CHECK (rental_fee_per_day >= 0),
  deposit             NUMERIC(12,2) CHECK (deposit >= 0),
  status              TEXT NOT NULL DEFAULT 'available'
                       CHECK (status IN ('available', 'rented', 'maintenance', 'inactive')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_item_updated_at
  BEFORE UPDATE ON Item
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 7.5 ItemCondition — เงื่อนไขการเช่าต่อสินค้า (weak entity ของ Item)
-- แต่ละสินค้ามีเงื่อนไขของตัวเอง พิมพ์อิสระ ไม่ reuse ข้ามสินค้า (ของใครของมัน)
-- Partial key = seq (ลำดับการแสดงผล) รวมกับ item_id เป็น composite PK
-- CASCADE: เงื่อนไขไม่มีความหมายถ้าไม่มีสินค้าที่มันผูกอยู่
-- ============================================================================
CREATE TABLE ItemCondition (
  item_id   UUID NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
  seq       INTEGER NOT NULL,
  condition TEXT NOT NULL,
  PRIMARY KEY (item_id, seq)
);


-- ============================================================================
-- 8. ItemImage — รูปสินค้า (weak entity ของ Item)
-- CASCADE: รูปไม่มีความหมายถ้าไม่มีสินค้าที่มันประกอบอยู่
-- ============================================================================
CREATE TABLE ItemImage (
  image_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sequence   INTEGER,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_itemimage_updated_at
  BEFORE UPDATE ON ItemImage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- กันไม่ให้สินค้าชิ้นเดียวมีรูปปก (is_primary) มากกว่า 1 รูป
CREATE UNIQUE INDEX idx_itemimage_one_primary_per_item
  ON ItemImage (item_id) WHERE is_primary = true;


-- ============================================================================
-- 9. ItemLocation — จุดนัดรับ-คืนของสินค้า (มีได้หลายจุดต่อ 1 สินค้า)
-- CASCADE: จุดนัดรับผูกกับสินค้าชิ้นนั้นโดยตรง
-- ============================================================================
CREATE TABLE ItemLocation (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
  description TEXT,
  no          TEXT,
  alley       TEXT,
  road        TEXT,
  subdistrict TEXT,
  district    TEXT,
  province    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_itemlocation_updated_at
  BEFORE UPDATE ON ItemLocation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 10. Availability — ช่วงวันที่สินค้าเปิดให้เช่าได้
-- CASCADE: ช่วงเวลาผูกกับสินค้าโดยตรง
-- ============================================================================
CREATE TABLE Availability (
  availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_availability_updated_at
  BEFORE UPDATE ON Availability
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 11. RentalOrder — คำสั่งเช่า (ตารางธุรกรรมหลัก ห้าม CASCADE ลบตาม User/Item)
-- RESTRICT: ห้ามลบ user หรือ item ถ้ามีประวัติการเช่าผูกอยู่ — ข้อมูลนี้คือ audit trail
-- ============================================================================
CREATE TABLE RentalOrder (
  order_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,  -- ผู้เช่า
  item_id         UUID NOT NULL REFERENCES Item(item_id) ON DELETE RESTRICT,
  meetup_location TEXT,   -- snapshot ข้อความ ไม่ใช่ FK ไป ItemLocation กันข้อมูลเพี้ยนถ้ามีการแก้ไขทีหลัง
  return_location TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  return_at       TIMESTAMPTZ,
  rental_fee      NUMERIC(12,2) CHECK (rental_fee >= 0),
  deposit         NUMERIC(12,2) CHECK (deposit >= 0),
  total_paid      NUMERIC(12,2) CHECK (total_paid >= 0),
  fee             NUMERIC(12,2) CHECK (fee >= 0),
  net_income      NUMERIC(12,2),
  status          TEXT NOT NULL DEFAULT 'requested'
                   CHECK (status IN ('requested', 'awaiting_payment', 'paid', 'item_sent',
                                      'item_returned', 'awaiting_additional_payment',
                                      'completed', 'rejected', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_rentalorder_updated_at
  BEFORE UPDATE ON RentalOrder
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ★ กันการจองสินค้าชิ้นเดียวกันซ้อนวันกัน ที่ระดับฐานข้อมูล (ตอบคำถามที่โน้ตไว้ในเอกสาร
--   "ถ้ามีอีกคนขอจองวันเดียวกันพร้อมกัน อนุญาตไหม") — เฉพาะ order ที่ยังมีผลอยู่ (ไม่รวม
--   rejected/cancelled) จะห้ามช่วงวันที่ทับกันของ item เดียวกันเด็ดขาด ฐานข้อมูลจะ error
--   ทันทีถ้ามีการพยายามจองซ้อน ไม่ว่าจะยิง request มาพร้อมกันกี่ตัวก็ตาม
ALTER TABLE RentalOrder
  ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING gist (
    item_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
  WHERE (status IN ('requested', 'awaiting_payment', 'paid', 'item_sent'));


-- ============================================================================
-- 12. Payment — การชำระเงิน
-- CASCADE ฝั่ง order_id: ถ้า (ในทางทฤษฎี) order ถูกลบ payment ที่ผูกกับ order นั้นก็ไม่มี
--   ความหมายแล้ว แต่ในทางปฏิบัติ RentalOrder ไม่ควรถูกลบเลย จึงแทบไม่มีผลจริง
-- RESTRICT ฝั่ง user_id: ห้ามลบ user ถ้ามีประวัติการจ่ายเงิน (audit trail ทางบัญชี)
-- ============================================================================
CREATE TABLE Payment (
  payment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES RentalOrder(order_id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
  amount          NUMERIC(12,2) CHECK (amount >= 0),   -- จำนวนเงินของ payment แถวนี้ (จ่าย/คืน/จ่ายเพิ่ม)
  date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slip_image_url  TEXT,
  transaction_ref TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payment_updated_at
  BEFORE UPDATE ON Payment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 13. RentalEvidenceImage — รูปหลักฐานสภาพสินค้า (ก่อน/หลัง ของทั้งสองฝ่าย)
-- CASCADE ฝั่ง order_id: หลักฐานอยู่ในบริบทของ order นั้นเท่านั้น
-- RESTRICT ฝั่ง user_id: ห้ามลบ user ถ้ามีหลักฐานที่เขาอัปโหลดไว้ (อาจใช้สู้คดีทีหลัง)
-- ============================================================================
CREATE TABLE RentalEvidenceImage (
  evidence_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES RentalOrder(order_id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
  evidence_type  TEXT NOT NULL
                  CHECK (evidence_type IN ('renter_before', 'renter_after', 'lender_before', 'lender_after')),
  image_url      TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_rentalevidenceimage_updated_at
  BEFORE UPDATE ON RentalEvidenceImage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 14. Review — รีวิวการเช่า
-- CASCADE ฝั่ง order_id: รีวิวอยู่ในบริบทของ order นั้น
-- ============================================================================
CREATE TABLE Review (
  review_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES RentalOrder(order_id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id)   -- 1 order รีวิวได้แค่ครั้งเดียว
);

CREATE TRIGGER trg_review_updated_at
  BEFORE UPDATE ON Review
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 15. ReviewImage — รูปประกอบรีวิว (weak entity ของ Review)
-- CASCADE: รูปไม่มีความหมายถ้าไม่มีรีวิวที่มันประกอบอยู่
-- ============================================================================
CREATE TABLE ReviewImage (
  image_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL REFERENCES Review(review_id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  sequence   INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 16. RentalReportType — ประเภทของการรายงานปัญหา
-- ============================================================================
CREATE TABLE RentalReportType (
  report_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type    TEXT NOT NULL UNIQUE
                  CHECK (report_type IN ('lender_no_show', 'renter_no_show', 'damaged_item',
                                          'false_advertisement', 'other'))
);

INSERT INTO RentalReportType (report_type) VALUES
  ('lender_no_show'), ('renter_no_show'), ('damaged_item'), ('false_advertisement'), ('other');


-- ============================================================================
-- 17. RentalReport — รายงานปัญหา/ข้อพิพาท
-- CASCADE ฝั่ง order_id: รายงานอยู่ในบริบทของ order นั้น
-- RESTRICT ฝั่ง user_id / report_type_id: ห้ามลบ user หรือ ประเภทรายงานที่ถูกอ้างอิงอยู่
-- ============================================================================
CREATE TABLE RentalReport (
  report_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type_id UUID NOT NULL REFERENCES RentalReportType(report_type_id) ON DELETE RESTRICT,
  user_id        UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,  -- คนที่รีพอร์ต
  order_id       UUID NOT NULL REFERENCES RentalOrder(order_id) ON DELETE CASCADE,
  report_topic   TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending_investigation'
                  CHECK (status IN ('pending_investigation', 'resolved', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

CREATE TRIGGER trg_rentalreport_updated_at
  BEFORE UPDATE ON RentalReport
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 18. RentalReportImage — รูปหลักฐานเพิ่มเติมประกอบรายงาน
-- CASCADE: รูปไม่มีความหมายถ้าไม่มีรายงานที่มันประกอบอยู่
-- ============================================================================
CREATE TABLE RentalReportImage (
  image_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID NOT NULL REFERENCES RentalReport(report_id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 19. ChatRoom — ห้องแชทระหว่างผู้เช่ากับผู้ให้เช่า
-- RESTRICT: ห้ามลบ user ถ้ายังมีห้องแชทค้างอยู่ (เก็บประวัติสนทนาไว้)
-- UNIQUE(renter_id, lender_id): กันไม่ให้สร้างห้องแชทซ้ำระหว่างคู่เดิม
-- ============================================================================
CREATE TABLE ChatRoom (
  chat_room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id    UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
  lender_id    UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
  last_message TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (renter_id, lender_id),
  CHECK (renter_id <> lender_id)   -- กัน user แชทกับตัวเอง
);


-- ============================================================================
-- 20. Message — ข้อความในห้องแชท
-- CASCADE ฝั่ง chat_room_id: ข้อความอยู่ในบริบทห้องแชทเท่านั้น
-- SET NULL ฝั่ง order_id: ข้อความอาจอ้างอิง order หรือไม่ก็ได้ (คุยทั่วไปก่อนจอง)
-- RESTRICT ฝั่ง sender_id: เก็บประวัติผู้ส่งไว้เสมอ
-- ============================================================================
CREATE TABLE Message (
  message_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES ChatRoom(chat_room_id) ON DELETE CASCADE,
  order_id     UUID REFERENCES RentalOrder(order_id) ON DELETE SET NULL,
  sender_id    UUID NOT NULL REFERENCES UserAccount(user_id) ON DELETE RESTRICT,
  type         TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image')),
  content      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- INDEXES
-- Postgres สร้าง index ให้อัตโนมัติเฉพาะ PRIMARY KEY และ UNIQUE เท่านั้น
-- คอลัมน์ Foreign Key อื่นๆ "ไม่ได้" ถูก index ให้อัตโนมัติ ต้องสร้างเองเพื่อให้ JOIN/WHERE เร็ว
-- ============================================================================

-- Item: ใช้บ่อยตอนค้นหา/กรอง/แสดงของแต่ละ user
CREATE INDEX idx_item_user_id ON Item(user_id);
CREATE INDEX idx_item_category_id ON Item(category_id);
CREATE INDEX idx_item_status ON Item(status);
CREATE INDEX idx_item_name_trgm ON Item USING gin (item_name gin_trgm_ops);  -- fuzzy search ชื่อสินค้า

-- ItemCondition / ItemImage / ItemLocation / Availability: join กับ Item บ่อยมาก
CREATE INDEX idx_itemcondition_item_id ON ItemCondition(item_id);
CREATE INDEX idx_itemimage_item_id ON ItemImage(item_id);
CREATE INDEX idx_itemlocation_item_id ON ItemLocation(item_id);
CREATE INDEX idx_availability_item_id ON Availability(item_id);
CREATE INDEX idx_availability_item_daterange ON Availability USING gist (item_id, daterange(start_date, end_date, '[]'));

-- RentalOrder: ใช้บ่อยตอนดูประวัติการเช่าของ user, ดูสถานะ, filter
CREATE INDEX idx_rentalorder_user_id ON RentalOrder(user_id);
CREATE INDEX idx_rentalorder_item_id ON RentalOrder(item_id);
CREATE INDEX idx_rentalorder_status ON RentalOrder(status);

-- Payment
CREATE INDEX idx_payment_order_id ON Payment(order_id);
CREATE INDEX idx_payment_user_id ON Payment(user_id);
CREATE INDEX idx_payment_status ON Payment(status);

-- RentalEvidenceImage / Review / RentalReport
CREATE INDEX idx_evidence_order_id ON RentalEvidenceImage(order_id);
CREATE INDEX idx_review_order_id ON Review(order_id);
CREATE INDEX idx_report_user_id ON RentalReport(user_id);
CREATE INDEX idx_report_order_id ON RentalReport(order_id);
CREATE INDEX idx_report_status ON RentalReport(status);

-- ChatRoom / Message: ใช้บ่อยที่สุดในระบบแชท ต้อง index ให้ดี
CREATE INDEX idx_chatroom_renter_id ON ChatRoom(renter_id);
CREATE INDEX idx_chatroom_lender_id ON ChatRoom(lender_id);
CREATE INDEX idx_message_chat_room_id_created_at ON Message(chat_room_id, created_at);  -- composite: โหลดข้อความเรียงเวลาในห้องเดียว
CREATE INDEX idx_message_order_id ON Message(order_id);
CREATE INDEX idx_message_sender_id ON Message(sender_id);

-- UserAccount: ใช้บ่อยตอน login / ค้นหา
CREATE INDEX idx_useraccount_status ON UserAccount(status);
-- email และ national_id มี UNIQUE constraint อยู่แล้ว ซึ่ง Postgres สร้าง index ให้อัตโนมัติ ไม่ต้องสร้างซ้ำ
