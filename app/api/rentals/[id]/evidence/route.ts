import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { uploadEvidenceSchema } from "@/lib/validations/rental";

type Params = { params: Promise<{ id: string }> };

// POST /api/rentals/[id]/evidence
// ใช้สำหรับ "หน้าอัปโหลดสลิป" (evidence รูปสภาพสินค้า ไม่ใช่สลิปโอนเงิน — สลิปโอนเงิน
// อยู่ที่ POST /api/payments) และหน้ายืนยันรับ/คืนสินค้าของ Toey (renter_before/after,
// lender_before/after) โยนตรงเข้า RPC upload_rental_evidence ที่เช็คสิทธิ์ auth.uid()
// ในตัวอยู่แล้วว่าห้ามอัปโหลดแทนคนอื่น
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

  const body = await request.json();
  const parsed = uploadEvidenceSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return apiError(firstError, 400, parsed.error.flatten());
  }

  const { evidenceType, imageUrls, newStatus } = parsed.data;

  const { error } = await supabase.rpc("upload_rental_evidence", {
    p_order_id: id,
    p_user_id: user.id,
    p_evidence_type: evidenceType,
    p_image_urls: imageUrls,
    p_new_status: newStatus ?? null,
  });

  if (error) {
    console.error("Error uploading rental evidence:", error);
    return apiError("ไม่สามารถอัปโหลดหลักฐานได้", 500, error.message);
  }

  return apiSuccess({ message: "อัปโหลดหลักฐานสำเร็จ" }, 201);
}
