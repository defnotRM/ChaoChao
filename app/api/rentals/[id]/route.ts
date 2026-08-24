import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateRentalOrderStatusSchema } from "@/lib/validations/rental";

type Params = { params: Promise<{ id: string }> };

// GET /api/rentals/[id] — หน้ารายละเอียดรายการเช่า
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("RentalOrder")
    .select(
      `
        order_id, user_id, item_id, meetup_location, return_location,
        start_date, end_date, return_at, rental_fee, deposit, total_paid,
        fee, net_income, status, created_at, updated_at,
        Item ( item_id, item_name, user_id, ItemImage ( image_url, is_primary ) ),
        Payment ( payment_id, amount, status, slip_image_url, date )
      `
    )
    .eq("order_id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching rental order:", error);
    return apiError("ไม่สามารถดึงข้อมูลรายการเช่าได้", 500);
  }
  if (!data) {
    return apiError("ไม่พบรายการเช่านี้", 404);
  }

  return apiSuccess(data);
}

// PATCH /api/rentals/[id] — เปลี่ยนสถานะแบบที่ไม่กระทบเงิน
// (approve -> awaiting_payment, reject -> rejected, cancel -> cancelled)
// สถานะที่กระทบเงิน (paid, completed) ต้องผ่าน endpoint เฉพาะ:
//   POST /api/rentals/[id]/settle  หรือ  RPC อื่นที่เกี่ยวกับ Payment เท่านั้น
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อน", 401);
  }

  const body = await request.json();
  const parsed = updateRentalOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("สถานะที่ส่งมาไม่ถูกต้อง", 400, parsed.error.flatten());
  }

  const { status } = parsed.data;

  // ล็อกแถวก่อนเช็ค/แก้ ป้องกันสองฝ่ายกดพร้อมกัน (เช่น approve กับ cancel ชนกัน)
  // — ทำผ่าน RPC เพื่อให้ SELECT...FOR UPDATE กับ UPDATE อยู่ใน transaction เดียวกันจริง
  // (ดูตัวอย่างที่ 02_example_transactions.sql ข้อ 2) ตอนนี้ยังไม่มี RPC เฉพาะสำหรับ
  // เคสนี้ใน 03_business_logic_functions.sql เลยเขียนแบบ optimistic check ไปก่อน:
  const { data: current, error: fetchError } = await supabase
    .from("RentalOrder")
    .select("order_id, status, item_id")
    .eq("order_id", id)
    .maybeSingle();

  if (fetchError || !current) {
    return apiError("ไม่พบรายการเช่านี้", 404);
  }

  const allowedFrom: Record<string, string[]> = {
    awaiting_payment: ["requested"],
    rejected: ["requested"],
    cancelled: ["requested", "awaiting_payment"],
  };

  if (!allowedFrom[status]?.includes(current.status)) {
    return apiError(
      `ไม่สามารถเปลี่ยนสถานะจาก "${current.status}" เป็น "${status}" ได้`,
      409
    );
  }

  const { data, error } = await supabase
    .from("RentalOrder")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("order_id", id)
    .eq("status", current.status) // กัน race condition อีกชั้น: update ได้ก็ต่อเมื่อ status ยังไม่ถูกเปลี่ยนไปก่อน
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating rental order status:", error);
    return apiError("ไม่สามารถเปลี่ยนสถานะได้", 500);
  }
  if (!data) {
    return apiError("สถานะถูกเปลี่ยนไปแล้วโดยคำขออื่น กรุณารีเฟรชแล้วลองใหม่", 409);
  }

  return apiSuccess({ message: "เปลี่ยนสถานะสำเร็จ", order: data });
}
