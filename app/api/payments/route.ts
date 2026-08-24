import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createPaymentSchema } from "@/lib/validations/payment";

// POST /api/payments — ผู้เช่าอัปโหลดสลิปโอนเงิน สร้าง Payment แถวใหม่สถานะ 'pending'
// ยังไม่ mark ว่า order 'paid' ในขั้นนี้ — ต้องรอ admin/webhook เรียก
// POST /api/payments/[id]/confirm ก่อน (ดู confirm_additional_payment RPC ที่บังคับ
// is_admin() อยู่แล้วฝั่ง DB — endpoint ฝั่ง user จึงทำได้แค่ "แจ้ง" ไม่ใช่ "ยืนยัน" เอง)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อน", 401);
  }

  const body = await request.json();
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return apiError(firstError, 400, parsed.error.flatten());
  }

  const { orderId, amount, slipImageUrl, transactionRef } = parsed.data;

  // ยืนยันว่า order นี้เป็นของผู้เช่าที่กำลังเรียกอยู่จริง และอยู่ในสถานะที่จ่ายเงินได้
  const { data: order, error: orderError } = await supabase
    .from("RentalOrder")
    .select("order_id, user_id, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return apiError("ไม่พบรายการเช่านี้", 404);
  }
  if (order.user_id !== user.id) {
    return apiError("คุณไม่มีสิทธิ์ชำระเงินสำหรับรายการเช่านี้", 403);
  }
  if (!["awaiting_payment", "awaiting_additional_payment"].includes(order.status)) {
    return apiError(`ไม่สามารถชำระเงินได้ในสถานะ "${order.status}"`, 409);
  }

  const { data, error } = await supabase
    .from("Payment")
    .insert({
      order_id: orderId,
      user_id: user.id,
      amount,
      slip_image_url: slipImageUrl,
      transaction_ref: transactionRef ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating payment:", error);
    return apiError("ไม่สามารถบันทึกการชำระเงินได้", 500);
  }

  return apiSuccess(
    { message: "ส่งหลักฐานการชำระเงินสำเร็จ กำลังรอตรวจสอบ", payment: data },
    201
  );
}
