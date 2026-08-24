# Database Setup — ChaoChao

ไฟล์ SQL ในโฟลเดอร์นี้คือ schema, business logic, RLS policies และ seed data
ของฐานข้อมูล ChaoChao ที่ผ่านการทดสอบแล้ว (16/18 automated tests PASS —
2 ที่เหลือ fail เพราะปัญหา test script เอง ไม่ใช่ schema)

## ลำดับการรัน (สำคัญมาก ห้ามสลับ)

รันตามลำดับนี้ผ่าน **Supabase SQL Editor** (Dashboard → SQL Editor → New query)
หรือ `psql` ก็ได้ ทีละไฟล์ตามลำดับ:

1. `01_schema.sql` — สร้าง 21 ตาราง (UserAccount, Role, Item, RentalOrder,
   Payment, ChatRoom, Message ฯลฯ) พร้อม constraints และ exclusion constraint
   กันจองซ้อน
2. `04_rls_policies.sql` — เปิด RLS และตั้ง policy ทุกตาราง (ต้องรันก่อน seed
   เพื่อให้แน่ใจว่า policy ครอบตารางตั้งแต่มีข้อมูลแรก)
3. `03_business_logic_functions.sql` — RPC functions (create_item_listing,
   settle_rental_order, submit_review ฯลฯ) ที่ backend จะเรียกผ่าน
   `supabase.rpc(...)`
4. `05_seed_data.sql` — ข้อมูลตัวอย่างสำหรับ dev/testing

> **ลำดับรันจริง: 01 → 04 → 03 → 05**
> (RLS ต้องมาก่อน business logic functions เพราะบาง function อ้างอิง
> permission check ที่ผูกกับ policy)

`02_example_transactions.sql` **ไม่ใช่ migration** — เป็นไฟล์ตัวอย่างสอนวิธี
เขียน transaction/RPC ให้ atomic (race condition ตอนจอง, row locking ตอน
อนุมัติ, all-or-nothing ตอนจ่ายเงิน) ใช้เป็น reference เวลาเขียน backend
function เพิ่มเติม ไม่ต้องรันเข้าฐานข้อมูลจริง

## ก่อนรัน

ทุกคนในทีมต้องใช้ **Supabase project เดียวกัน** (ไม่ว่าจะเป็น cloud project
กลาง หรือ local ผ่าน Supabase CLI ที่ sync กัน) — ถ้าใครรันไฟล์นี้บน project
แยกของตัวเอง ตารางที่ได้จะไม่ match กับที่คนอื่นเห็น และ API ที่เขียนต่อกัน
จะพังตอน integration

ถ้ายังไม่แน่ใจว่าทีมใช้ project ไหนอยู่ ให้เช็คกับ Role B (Port) ก่อนรัน
