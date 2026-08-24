import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  createProductSchema,
  listProductsQuerySchema,
} from "@/lib/validations/product";

// GET /api/products?q=&categoryId=&minPrice=&maxPrice=&province=&status=&sort=&page=&pageSize=
// Search + Filter Query ตามสโคป Role B
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = listProductsQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    province: searchParams.get("province") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return apiError(
      "พารามิเตอร์ค้นหาไม่ถูกต้อง",
      400,
      parsed.error.flatten()
    );
  }

  const { q, categoryId, minPrice, maxPrice, province, status, sort, page, pageSize } =
    parsed.data;

  const supabase = await createClient();

  // ต้อง join ItemLocation ตอน filter province เลยต้องใช้ !inner join syntax ของ PostgREST
  let query = supabase
    .from("Item")
    .select(
      `
        item_id, user_id, category_id, item_name, description,
        original_price, rental_fee_per_day, deposit, status, created_at,
        ItemImage ( image_id, image_url, is_primary, sequence ),
        ItemLocation${province ? "!inner" : ""} ( province, district )
      `,
      { count: "exact" }
    )
    .eq("status", status);

  if (q) {
    // full-text search แบบง่ายบน item_name + description
    query = query.or(`item_name.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (minPrice !== undefined) {
    query = query.gte("rental_fee_per_day", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("rental_fee_per_day", maxPrice);
  }
  if (province) {
    query = query.eq("ItemLocation.province", province);
  }

  switch (sort) {
    case "price_asc":
      query = query.order("rental_fee_per_day", { ascending: true });
      break;
    case "price_desc":
      query = query.order("rental_fee_per_day", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return apiError("ไม่สามารถดึงข้อมูลสินค้าได้", 500);
  }

  return apiSuccess({
    items: data,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    },
  });
}

// POST /api/products — สร้างสินค้าใหม่ (เฉพาะ lender ที่ login แล้ว)
// เรียกผ่าน RPC create_item_listing เพื่อให้ insert Item + ItemImage + ItemLocation +
// Availability + ItemCondition ทั้งหมดอยู่ใน transaction เดียวกัน (all-or-nothing)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อนลงประกาศสินค้า", 401);
  }

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return apiError(firstError, 400, parsed.error.flatten());
  }

  const input = parsed.data;

  const { data: itemId, error } = await supabase.rpc("create_item_listing", {
    p_user_id: user.id,
    p_category_id: input.categoryId ?? null,
    p_item_name: input.itemName,
    p_description: input.description,
    p_original_price: input.originalPrice ?? null,
    p_rental_fee_per_day: input.rentalFeePerDay,
    p_deposit: input.deposit,
    p_images: input.images.map((img) => ({
      image_url: img.imageUrl,
      is_primary: img.isPrimary,
      sequence: img.sequence,
    })),
    p_locations: input.locations,
    p_availability_start: input.availabilityStart,
    p_availability_end: input.availabilityEnd,
    p_conditions: input.conditions,
  });

  if (error) {
    console.error("Error creating item listing:", error);
    return apiError("ไม่สามารถสร้างประกาศสินค้าได้", 500, error.message);
  }

  return apiSuccess({ message: "สร้างประกาศสินค้าสำเร็จ", itemId }, 201);
}
