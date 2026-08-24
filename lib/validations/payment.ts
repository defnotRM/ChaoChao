import { z } from "zod";

// ผู้เช่าอัปโหลดสลิปโอนเงิน — สร้าง Payment แถวใหม่ สถานะเริ่มที่ 'pending'
// รอ Palm/E ต่อ Storage bucket จริงสำหรับเก็บรูปสลิป ตอนนี้รับเป็น URL ตรงๆ ก่อน
export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "order ไม่ถูกต้อง"),
  amount: z.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
  slipImageUrl: z.string().url("URL สลิปไม่ถูกต้อง"),
  transactionRef: z.string().max(100).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ใช้ยืนยันการจ่ายเงินเพิ่ม (กรณีมีค่าเสียหาย) — ต้องมาจาก admin/payment gateway เท่านั้น
// ตรงกับ RPC confirm_additional_payment ที่เช็ค is_admin() อยู่แล้วในฝั่ง DB
export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1, "paymentId ไม่ถูกต้อง"),
});
