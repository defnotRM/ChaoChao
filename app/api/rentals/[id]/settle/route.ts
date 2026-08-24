import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { settleRentalOrderSchema } from "@/lib/validations/rental";

type Params = { params: Promise<{ id: string }> };

// POST /api/rentals/[id]/settle
// ใช้ตอนเจ้าของสินค้ากด "ยืนยันคืนสินค้า" (หน้าของ Toey) พร้อมระบุค่าเสียหาย (ถ้ามี)
// เรียกผ่าน RPC settle_rental_order ซึ่งจัดการ: ล็อกแถวกันกดซ้ำ, คำนวณเงินคืน/หัก
// ค่าเสียหายจาก deposit, และปิดสถานะ order ทั้งหมดในทรานแซกชันเดียว
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อน", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = settleRentalOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("ข้อมูลไม่ถูกต้อง", 400, parsed.error.flatten());
  }

  const { damageCost } = parsed.data;

  const { data, error } = await supabase.rpc("settle_rental_order", {
    p_order_id: id,
    p_damage_cost: damageCost,
  });

  if (error) {
    console.error("Error settling rental order:", error);
    return apiError("ไม่สามารถปิดรายการเช่าได้", 500, error.message);
  }

  // RPC คืนค่าเป็น TEXT อธิบายผลลัพธ์ (เช่น สถานะถัดไปคืออะไร)
  return apiSuccess({ message: "ปิดรายการเช่าสำเร็จ", result: data });
}
