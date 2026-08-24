import { z } from "zod";

export const createRentalOrderSchema = z.object({
  itemId: z.string().min(1, "item ไม่ถูกต้อง"),
  startDate: z.string().date("รูปแบบวันที่ไม่ถูกต้อง"),
  endDate: z.string().date("รูปแบบวันที่ไม่ถูกต้อง"),
  meetupLocation: z.string().max(500).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "วันคืนสินค้าต้องไม่มาก่อนวันเริ่มเช่า",
  path: ["endDate"],
});

export type CreateRentalOrderInput = z.infer<typeof createRentalOrderSchema>;

// การเปลี่ยนสถานะที่ "อนุญาต" ให้ทำผ่าน endpoint ธรรมดา (ไม่ใช่ผ่าน RPC พิเศษ)
// การเปลี่ยนสถานะที่กระทบเงิน (paid, completed) ต้องผ่าน RPC/endpoint เฉพาะเท่านั้น
export const simpleStatusTransitions = [
  "awaiting_payment", // เจ้าของสินค้า approve คำขอ
  "rejected",          // เจ้าของสินค้า reject คำขอ
  "cancelled",          // ผู้เช่ายกเลิกก่อนจ่ายเงิน
] as const;

export const updateRentalOrderStatusSchema = z.object({
  status: z.enum(simpleStatusTransitions),
});

export const settleRentalOrderSchema = z.object({
  damageCost: z.number().min(0).optional().default(0),
});

export const uploadEvidenceSchema = z.object({
  evidenceType: z.enum([
    "renter_before",
    "renter_after",
    "lender_before",
    "lender_after",
  ]),
  imageUrls: z.array(z.string().url()).min(1, "ต้องแนบรูปอย่างน้อย 1 รูป"),
  newStatus: z
    .enum([
      "requested",
      "awaiting_payment",
      "paid",
      "item_sent",
      "item_returned",
      "awaiting_additional_payment",
      "completed",
      "rejected",
      "cancelled",
    ])
    .optional(),
});

export const listRentalOrdersQuerySchema = z.object({
  role: z.enum(["renter", "lender"]).default("renter"), // ดูในฐานะผู้เช่า หรือ ผู้ให้เช่า (ผ่าน item ที่ตัวเองเป็นเจ้าของ)
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
