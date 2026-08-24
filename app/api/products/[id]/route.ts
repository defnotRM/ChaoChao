import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateProductSchema } from "@/lib/validations/product";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

// GET /api/products/[id] — หน้ารายละเอียดสินค้า
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("item")
      .select(
        `
          item_id, user_id, category_id, item_name, description,
          original_price, rental_fee_per_day, deposit, status, created_at, updated_at,
          category:category_id ( category_id, category_name ),
          itemimage ( image_id, image_url, is_primary, sequence ),
          itemlocation ( location_id, description, no, alley, road, subdistrict, district, province ),
          itemcondition ( seq, condition ),
          availability ( availability_id, start_date, end_date )
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
  } catch (err) {
    console.error("Error in GET /api/products/[id]:", err);
    return apiError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 500);
  }
}

// PATCH /api/products/[id] — แก้ไขสินค้า
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return apiError(firstError, 400, parsed.error.flatten());
    }

    const input = parsed.data;
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId;
    if (input.itemName !== undefined) updatePayload.item_name = input.itemName;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.originalPrice !== undefined) updatePayload.original_price = input.originalPrice;
    if (input.rentalFeePerDay !== undefined) updatePayload.rental_fee_per_day = input.rentalFeePerDay;
    if (input.deposit !== undefined) updatePayload.deposit = input.deposit;
    if (input.status !== undefined) updatePayload.status = input.status;

    // 1) Update Item table
    const { data: itemData, error: itemError } = await admin
      .from("item")
      .update(updatePayload)
      .eq("item_id", id)
      .select()
      .maybeSingle();

    if (itemError) {
      console.error("Error updating product:", itemError);
      return apiError("ไม่สามารถแก้ไขสินค้าได้", 500);
    }
    if (!itemData) {
      return apiError("ไม่พบสินค้านี้", 404);
    }

    // 2) Update Locations if provided
    if (input.locations && input.locations.length > 0) {
      await admin.from("itemlocation").delete().eq("item_id", id);
      const locationRows = input.locations.map((loc) => ({
        item_id: id,
        description: loc.description || "จุดนัดรับที่ตกลงกัน",
        no: loc.no || "-",
        alley: loc.alley || null,
        road: loc.road || null,
        subdistrict: loc.subdistrict || "",
        district: loc.district || "",
        province: loc.province || "กรุงเทพมหานคร",
      }));
      await admin.from("itemlocation").insert(locationRows);
    }

    // 3) Update Availability if provided
    if (input.availabilityStart && input.availabilityEnd) {
      await admin.from("availability").delete().eq("item_id", id);
      await admin.from("availability").insert({
        item_id: id,
        start_date: input.availabilityStart,
        end_date: input.availabilityEnd,
      });
    }

    // 4) Update Conditions if provided
    if (input.conditions !== undefined && input.conditions !== null) {
      await admin.from("itemcondition").delete().eq("item_id", id);
      if (input.conditions.length > 0) {
        const conditionRows = input.conditions.map((cond, seq) => ({
          item_id: id,
          seq: seq + 1,
          condition: cond,
        }));
        await admin.from("itemcondition").insert(conditionRows);
      }
    }

    return apiSuccess({ message: "แก้ไขสินค้าสำเร็จ", item: itemData });
  } catch (err) {
    console.error("Error in PATCH /api/products/[id]:", err);
    return apiError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 500);
  }
}

// DELETE /api/products/[id] — ลบสินค้า (soft delete)
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("item")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("item_id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error deleting product:", error);
      return apiError("ไม่สามารถลบสินค้าได้", 500);
    }
    if (!data) {
      return apiError("ไม่พบสินค้านี้", 404);
    }

    return apiSuccess({ message: "ลบสินค้าสำเร็จ" });
  } catch (err) {
    console.error("Error in DELETE /api/products/[id]:", err);
    return apiError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 500);
  }
}
