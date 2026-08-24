import { z } from "zod";

// ตรงกับ constraint ใน Item table: original_price/rental_fee_per_day/deposit >= 0
const nonNegativeNumber = z
  .number()
  .min(0, "ต้องเป็นจำนวนที่ไม่ติดลบ");

export const createProductSchema = z.object({
  categoryId: z.string().nullable().optional(),
  itemName: z
    .string()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(200, "ชื่อสินค้าต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().max(2000).optional().default(""),
  originalPrice: nonNegativeNumber.optional(),
  rentalFeePerDay: nonNegativeNumber,
  deposit: nonNegativeNumber,
  images: z
    .array(
      z.object({
        imageUrl: z.string().url("URL รูปไม่ถูกต้อง"),
        isPrimary: z.boolean().default(false),
        sequence: z.number().int().optional(),
      })
    )
    .min(1, "ต้องมีรูปสินค้าอย่างน้อย 1 รูป"),
  locations: z
    .array(
      z.object({
        description: z.string().optional(),
        no: z.string().optional(),
        alley: z.string().optional(),
        road: z.string().optional(),
        subdistrict: z.string().optional(),
        district: z.string().optional(),
        province: z.string().optional(),
      })
    )
    .min(1, "ต้องระบุตำแหน่งสินค้าอย่างน้อย 1 ที่"),
  availabilityStart: z.string().date("รูปแบบวันที่ไม่ถูกต้อง"),
  availabilityEnd: z.string().date("รูปแบบวันที่ไม่ถูกต้อง"),
  conditions: z.array(z.string()).default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ใช้ตอนแก้ไขสินค้า — ทุก field เป็น optional เพราะแก้ทีละส่วนได้
export const updateProductSchema = z.object({
  categoryId: z.string().nullable().optional(),
  itemName: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  originalPrice: nonNegativeNumber.optional(),
  rentalFeePerDay: nonNegativeNumber.optional(),
  deposit: nonNegativeNumber.optional(),
  status: z
    .enum(["available", "rented", "maintenance", "inactive"])
    .optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// query params ตอน list/search/filter สินค้า
export const listProductsQuerySchema = z.object({
  q: z.string().optional(), // full-text search บน item_name/description
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  province: z.string().optional(),
  status: z
    .enum(["available", "rented", "maintenance", "inactive"])
    .optional()
    .default("available"),
  sort: z
    .enum(["newest", "price_asc", "price_desc"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
