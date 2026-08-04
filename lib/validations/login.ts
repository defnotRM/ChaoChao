import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "กรุณากรอกชื่อผู้ใช้"),

  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน"),

  role: z.enum(["tenant", "landlord"], {
    message: "กรุณาเลือกประเภทผู้ใช้งาน",
  }),
});

export const roleLabels = {
  tenant: "ผู้เช่า",
  landlord: "ผู้ให้เช่า",
} as const;

export type LoginFormData = z.infer<typeof loginSchema>;