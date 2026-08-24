import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateProductSchema } from "@/lib/validations/product";

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id] — หน้ารายละเอียดสินค้า
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Item")
    .select(
      `
        item_id, user_id, category_id, item_name, description,
        original_price, rental_fee_per_day, deposit, status, created_at, updated_at,
        ItemImage ( image_id, image_url, is_primary, sequence ),
        ItemLocation ( location_id, description, no, alley, road, subdistrict, district, province ),
        ItemCondition ( seq, condition ),
        Availability ( availability_id, start_date, end_date )
      `
    )
    .eq("item_id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product:", error);
    return apiError("ไม่สามารถดึงข้อมูลสินค้าได้", 500);
  }
  if (!data) {
    return apiError("ไม่พบสินค้านี้", 404);
  }

  return apiSuccess(data);
}

// PATCH /api/products/[id] — แก้ไขสินค้า (เฉพาะเจ้าของ — RLS จะบังคับอยู่แล้ว
// แต่เช็คซ้ำในนี้เพื่อให้ error message อ่านรู้เรื่องกว่า "no rows returned")
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
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return apiError(firstError, 400, parsed.error.flatten());
  }

  const input = parsed.data;
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId;
  if (input.itemName !== undefined) updatePayload.item_name = input.itemName;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.originalPrice !== undefined) updatePayload.original_price = input.originalPrice;
  if (input.rentalFeePerDay !== undefined) updatePayload.rental_fee_per_day = input.rentalFeePerDay;
  if (input.deposit !== undefined) updatePayload.deposit = input.deposit;
  if (input.status !== undefined) updatePayload.status = input.status;

  // ไม่ใส่ .eq("user_id", user.id) เพิ่มก็ได้เพราะ RLS policy บน Item บังคับอยู่แล้วว่า
  // แก้ได้เฉพาะแถวที่ user_id = auth.uid() — แต่ใส่ไว้ให้ query สั้นลงและ error ชัดขึ้น
  const { data, error } = await supabase
    .from("Item")
    .update(updatePayload)
    .eq("item_id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating product:", error);
    return apiError("ไม่สามารถแก้ไขสินค้าได้", 500);
  }
  if (!data) {
    return apiError("ไม่พบสินค้านี้ หรือคุณไม่มีสิทธิ์แก้ไข", 404);
  }

  return apiSuccess({ message: "แก้ไขสินค้าสำเร็จ", item: data });
}

// DELETE /api/products/[id] — เจ้าของลบสินค้าตัวเอง
// ใช้ soft delete (status = 'inactive') แทนการลบจริง เพื่อไม่ให้ประวัติการเช่าเก่าพัง
// (RentalOrder.item_id ผูก FK ไว้กับ Item แบบ ON DELETE RESTRICT อยู่แล้ว การ DELETE
// จริงจะ error ทันทีถ้ามี order ผูกอยู่ — soft delete จึงปลอดภัยกว่าเสมอ)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อน", 401);
  }

  const { data, error } = await supabase
    .from("Item")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("item_id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error deleting product:", error);
    return apiError("ไม่สามารถลบสินค้าได้", 500);
  }
  if (!data) {
    return apiError("ไม่พบสินค้านี้ หรือคุณไม่มีสิทธิ์ลบ", 404);
  }

  return apiSuccess({ message: "ลบสินค้าสำเร็จ" });
}
