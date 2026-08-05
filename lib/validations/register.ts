import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(4, "ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร")
    .max(20, "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร a-z, A-Z, 0-9 และ _"),

  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว"),

  nationalId: z
    .string()
    .length(13, "เลขบัตรประชาชนต้องมี 13 หลัก")
    .regex(/^\d+$/, "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น"),

  // เพิ่มใหม่: เลือกได้แค่ "lender" หรือ "renter" เท่านั้น
  role: z.enum(["lender", "renter"], {
    message: "กรุณาเลือกประเภทผู้ใช้งาน",
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ใช้แสดงผลเป็นภาษาไทยใน UI
export const roleLabels: Record<RegisterFormData["role"], string> = {
  renter: "ผู้เช่า",
  lender: "ผู้ให้เช่า",
};