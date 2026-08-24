import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

// POST /api/payments/[id]/confirm
// "หน้าตรวจสอบสถานะการชำระเงิน" ฝั่ง admin — ยืนยันว่าเงินเข้าจริง
// RPC confirm_additional_payment เช็ค is_admin() เองอยู่แล้ว ถ้าไม่ใช่ admin
// จะได้ error กลับมาจาก DB โดยตรง endpoint นี้แค่ห่อเป็น HTTP response ที่อ่านง่ายขึ้น
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อน", 401);
  }

  const { error } = await supabase.rpc("confirm_additional_payment", {
    p_payment_id: id,
  });

  if (error) {
    console.error("Error confirming payment:", error);
    // ข้อความจาก RPC จะบอกอยู่แล้วถ้าเป็นเพราะไม่ใช่ admin
    return apiError("ไม่สามารถยืนยันการชำระเงินได้", 403, error.message);
  }

  return apiSuccess({ message: "ยืนยันการชำระเงินสำเร็จ" });
}
