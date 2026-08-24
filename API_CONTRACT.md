# ChaoChao API Contract — Product / Rental / Payment

เอกสารนี้สรุป endpoint ที่ Role B (Port) เตรียมไว้ให้ Fanta (Product frontend)
และ Yok/Toey (Rental, Payment, Dashboard) เริ่มต่อ frontend คู่ขนานได้เลย
โดยไม่ต้องรอ backend deploy จริง — ทุก field ตรงกับ `supabase/migrations/01_schema.sql`

ทุก endpoint คืนค่า error ในรูปแบบเดียวกัน: `{ "message": "...", "details"?: ... }`

---

## Product API

### `GET /api/products`
รายการสินค้า พร้อม search/filter/sort/pagination

**Query params** (ทั้งหมด optional ยกเว้นที่ระบุ)
| param | type | หมายเหตุ |
|---|---|---|
| `q` | string | ค้นหาใน item_name + description |
| `categoryId` | uuid | |
| `minPrice` / `maxPrice` | number | กรองจาก `rental_fee_per_day` |
| `province` | string | |
| `status` | `available\|rented\|maintenance\|inactive` | default `available` |
| `sort` | `newest\|price_asc\|price_desc` | default `newest` |
| `page` / `pageSize` | number | default `1` / `20` |

**Response 200**
```json
{
  "items": [ { "item_id": "...", "item_name": "...", "rental_fee_per_day": 300,
               "ItemImage": [...], "ItemLocation": [...] } ],
  "pagination": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
}
```

### `POST /api/products`
สร้างสินค้าใหม่ (ต้อง login) — ใช้หน้า "เพิ่มสินค้า" ของ Fanta

**Body**
```json
{
  "categoryId": "uuid | null",
  "itemName": "string (required)",
  "description": "string",
  "originalPrice": 5000,
  "rentalFeePerDay": 300,
  "deposit": 1500,
  "images": [{ "imageUrl": "https://...", "isPrimary": true, "sequence": 1 }],
  "locations": [{ "description": "", "district": "", "province": "" }],
  "availabilityStart": "2026-08-24",
  "availabilityEnd": "2026-12-31",
  "conditions": ["ห้ามใช้ในที่เปียกชื้น"]
}
```
**Response 201** `{ "message": "...", "itemId": "uuid" }`

### `GET /api/products/[id]`
หน้ารายละเอียดสินค้า — คืนข้อมูลเต็มพร้อมรูป, ตำแหน่ง, เงื่อนไข, ช่วงวันว่าง

### `PATCH /api/products/[id]`
แก้ไขสินค้า (เฉพาะเจ้าของ) — ส่งเฉพาะ field ที่จะแก้ ที่เหลือ optional ทั้งหมด
รวมถึง `"status"` สำหรับปิด/เปิดขายเอง

### `DELETE /api/products/[id]`
ลบสินค้า (soft delete → `status = 'inactive'`) เฉพาะเจ้าของ

---

## Rental API

### `GET /api/rentals?role=renter|lender&status=&page=&pageSize=`
`role=renter` → รายการที่ฉันเช่า (สำหรับ "หน้าประวัติการเช่า" ฝั่งผู้เช่า)
`role=lender` → รายการที่คนอื่นมาเช่าของฉัน (สำหรับ "หน้ารายการสินค้าของฉัน" ฝั่งผู้ให้เช่า)

### `POST /api/rentals`
ผู้เช่าส่งคำขอเช่า — ใช้หน้า "ส่งคำขอเช่า" ของ Yok

**Body** `{ "itemId": "uuid", "startDate": "2026-09-01", "endDate": "2026-09-03", "meetupLocation": "string?" }`
**Response 409** ถ้าช่วงวันชนกับที่คนอื่นจองไปแล้ว: `{ "message": "สินค้านี้เพิ่งถูกจองไปในช่วงวันที่นี้ กรุณาเลือกวันอื่น" }`

### `GET /api/rentals/[id]`
รายละเอียดรายการเช่า + payment ที่เกี่ยวข้อง

### `PATCH /api/rentals/[id]`
เปลี่ยนสถานะแบบไม่กระทบเงิน — ใช้สำหรับปุ่ม "อนุมัติ/ปฏิเสธ/ยกเลิก" ของเจ้าของสินค้า

**Body** `{ "status": "awaiting_payment" | "rejected" | "cancelled" }`
กติกาการเปลี่ยนสถานะที่อนุญาต:
| จากสถานะ | ไปได้เป็น |
|---|---|
| `requested` | `awaiting_payment`, `rejected` |
| `requested`, `awaiting_payment` | `cancelled` |

สถานะอื่น (`paid`, `completed` ฯลฯ) เปลี่ยนผ่าน Payment/Settle endpoint เท่านั้น

### `POST /api/rentals/[id]/evidence`
อัปโหลดรูปหลักฐาน (ก่อน/หลังส่งของ, ก่อน/หลังคืนของ) — ใช้หน้า "ยืนยันรับ/คืนสินค้า" ของ Toey

**Body** `{ "evidenceType": "renter_before|renter_after|lender_before|lender_after", "imageUrls": ["https://..."], "newStatus": "item_sent?" }`

### `POST /api/rentals/[id]/settle`
เจ้าของกด "ยืนยันคืนสินค้า" พร้อมระบุค่าเสียหาย (ถ้ามี) — คำนวณเงินคืน/หักมัดจำอัตโนมัติ

**Body** `{ "damageCost": 0 }`

---

## Payment API

### `POST /api/payments`
ผู้เช่าอัปโหลดสลิปโอนเงิน — ใช้หน้า "อัปโหลดสลิป" ของ Yok
สร้าง payment สถานะ `pending` — **ยังไม่ mark ว่า order จ่ายแล้ว** ต้องรอ admin ยืนยัน

**Body** `{ "orderId": "uuid", "amount": 1800, "slipImageUrl": "https://...", "transactionRef": "string?" }`

### `POST /api/payments/[id]/confirm`
Admin ยืนยันว่าเงินเข้าจริง — ใช้หน้า "ตรวจสอบสถานะการชำระเงิน" ฝั่ง admin เท่านั้น
(endpoint นี้จะ error ทันทีถ้าคนเรียกไม่ใช่ admin — ฝั่ง DB บังคับผ่าน RPC อยู่แล้ว)

---

## หมายเหตุสำหรับ Yok/Toey

- ทุก endpoint ใช้ cookie session ของ Supabase Auth เหมือนกับที่ Roman ทำไว้ในหน้า
  login — ไม่ต้องแนบ token เอง ขอแค่ user login ผ่านหน้า login ก่อนแล้ว fetch
  แบบปกติ (`credentials` จะติดไปกับ cookie อัตโนมัติ)
- Storage bucket จริงสำหรับอัปโหลดไฟล์ (รูปสินค้า, สลิป, evidence) ยังไม่พร้อม —
  ตอนนี้ endpoint รับเป็น **URL string** เข้ามาตรงๆ ก่อน รอคุยกับ Palm (E) เรื่อง
  Storage แล้วจะอัปเดต endpoint ให้รับ FormData/file upload จริงทีหลัง
