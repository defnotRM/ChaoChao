import { z } from "zod";

// ตรงกับ constraint ใน Item table: original_price/rental_fee_per_day/deposit >= 0
const nonNegativeNumber = z
  .number()
  .min(0, "ต้องเป็นจำนวนที่ไม่ติดลบ");

export const createProductSchema = z.object({
  categoryId: z.string().nullish(),
  itemName: z
    .string()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(200, "ชื่อสินค้าต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().max(2000).nullish().default(""),
  originalPrice: nonNegativeNumber.nullish(),
  rentalFeePerDay: nonNegativeNumber,
  deposit: nonNegativeNumber,
  images: z
    .array(
      z.object({
        imageUrl: z.string().min(1, "URL รูปไม่ถูกต้อง"),
        isPrimary: z.boolean().nullish().default(false),
        sequence: z.number().int().nullish(),
      })
    )
    .nullish()
    .default([]),
  locations: z
    .array(
      z.object({
        description: z.string().nullish(),
        no: z.string().nullish(),
        alley: z.string().nullish(),
        road: z.string().nullish(),
        subdistrict: z.string().nullish(),
        district: z.string().nullish(),
        province: z.string().nullish(),
      })
    )
    .min(1, "ต้องระบุตำแหน่งสินค้าอย่างน้อย 1 ที่"),
  availabilityStart: z.string().min(1, "รูปแบบวันที่ไม่ถูกต้อง"),
  availabilityEnd: z.string().min(1, "รูปแบบวันที่ไม่ถูกต้อง"),
  conditions: z.array(z.string()).nullish().default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ใช้ตอนแก้ไขสินค้า — ทุก field เป็น optional เพราะแก้ทีละส่วนได้
export const updateProductSchema = z.object({
  categoryId: z.string().nullish(),
  itemName: z.string().min(1).max(200).nullish(),
  description: z.string().max(2000).nullish(),
  originalPrice: nonNegativeNumber.nullish(),
  rentalFeePerDay: nonNegativeNumber.nullish(),
  deposit: nonNegativeNumber.nullish(),
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
