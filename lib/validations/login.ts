import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "กรุณากรอกชื่อผู้ใช้"),

  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน"),

  role: z.enum(["renter", "lender"], {
    message: "กรุณาเลือกประเภทผู้ใช้งาน",
  }),
});

export const roleLabels = {
  renter: "ผู้เช่า",
  lender: "ผู้ให้เช่า",
} as const;

export type LoginFormData = z.infer<typeof loginSchema>;