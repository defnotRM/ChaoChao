import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateRentalOrderStatusSchema } from "@/lib/validations/rental";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/rentals/[id] — หน้ารายละเอียดรายการเช่า
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("rentalorder")
    .select(
      `
        order_id, user_id, item_id, meetup_location, return_location,
        start_date, end_date, rental_fee, deposit, total_paid,
        fee, net_income, status, created_at, updated_at,
        item:item_id ( item_id, item_name, user_id, rental_fee_per_day, deposit, itemimage ( image_url, is_primary ) ),
        payment:payment ( payment_id, amount, status, slip_image_url, date )
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

// PATCH /api/rentals/[id] — เปลี่ยนสถานะ (approve -> awaiting_payment, reject -> rejected, cancel -> cancelled)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createAdminClient();

  const body = await request.json().catch(() => ({}));
  const parsed = updateRentalOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("สถานะที่ส่งมาไม่ถูกต้อง", 400, parsed.error.flatten());
  }

  const { status } = parsed.data;

  const { data: current, error: fetchError } = await admin
    .from("rentalorder")
    .select("order_id, status, item_id, user_id")
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

  const { data, error } = await admin
    .from("rentalorder")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("order_id", id)
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
