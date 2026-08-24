import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, isBookingConflictError } from "@/lib/api-response";
import {
  createRentalOrderSchema,
  listRentalOrdersQuerySchema,
} from "@/lib/validations/rental";

// GET /api/rentals?role=renter|lender&status=&page=&pageSize=
// role=renter  -> รายการที่ฉันเป็นผู้เช่า (user_id = ฉัน)
// role=lender  -> รายการที่มีคนมาเช่าของฉัน (item.user_id = ฉัน)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = listRentalOrdersQuerySchema.safeParse({
    role: searchParams.get("role") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("พารามิเตอร์ไม่ถูกต้อง", 400, parsed.error.flatten());
  }

  const { role, status, page, pageSize } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อน", 401);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("RentalOrder")
    .select(
      `
        order_id, user_id, item_id, start_date, end_date, status,
        rental_fee, deposit, total_paid, created_at,
        Item ( item_id, item_name, user_id, ItemImage ( image_url, is_primary ) )
      `,
      { count: "exact" }
    )
    .range(from, to)
    .order("created_at", { ascending: false });

  if (role === "renter") {
    query = query.eq("user_id", user.id);
  } else {
    // role === "lender": ต้อง filter ผ่านตาราง Item ที่ user_id = ฉัน
    // ใช้ !inner join เพื่อบังคับให้ filter บน Item.user_id ทำงานได้จริงใน PostgREST
    query = supabase
      .from("RentalOrder")
      .select(
        `
          order_id, user_id, item_id, start_date, end_date, status,
          rental_fee, deposit, total_paid, created_at,
          Item!inner ( item_id, item_name, user_id, ItemImage ( image_url, is_primary ) )
        `,
        { count: "exact" }
      )
      .eq("Item.user_id", user.id)
      .range(from, to)
      .order("created_at", { ascending: false });
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching rental orders:", error);
    return apiError("ไม่สามารถดึงข้อมูลรายการเช่าได้", 500);
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

// POST /api/rentals — ผู้เช่าส่งคำขอเช่าสินค้า
// ไม่ต้องเช็ค overlap เองในโค้ด — ปล่อยให้ EXCLUDE constraint
// "no_overlapping_active_bookings" ใน RentalOrder จัดการให้ (ดู 02_example_transactions.sql)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("กรุณาเข้าสู่ระบบก่อนส่งคำขอเช่า", 401);
  }

  const body = await request.json();
  const parsed = createRentalOrderSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return apiError(firstError, 400, parsed.error.flatten());
  }

  const { itemId, startDate, endDate, meetupLocation } = parsed.data;

  // ดึงราคาสินค้าปัจจุบันมาคำนวณ rental_fee ฝั่ง server เสมอ ห้ามเชื่อราคาที่ client ส่งมา
  const { data: item, error: itemError } = await supabase
    .from("Item")
    .select("item_id, rental_fee_per_day, deposit, status")
    .eq("item_id", itemId)
    .maybeSingle();

  if (itemError || !item) {
    return apiError("ไม่พบสินค้านี้", 404);
  }
  if (item.status !== "available") {
    return apiError("สินค้านี้ไม่พร้อมให้เช่าในขณะนี้", 409);
  }

  const days =
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24) +
    1;
  const rentalFee = (item.rental_fee_per_day ?? 0) * days;

  const { data, error } = await supabase
    .from("RentalOrder")
    .insert({
      user_id: user.id,
      item_id: itemId,
      start_date: startDate,
      end_date: endDate,
      meetup_location: meetupLocation ?? null,
      rental_fee: rentalFee,
      deposit: item.deposit,
      status: "requested",
    })
    .select()
    .single();

  if (error) {
    if (isBookingConflictError(error)) {
      return apiError("สินค้านี้เพิ่งถูกจองไปในช่วงวันที่นี้ กรุณาเลือกวันอื่น", 409);
    }
    console.error("Error creating rental order:", error);
    return apiError("ไม่สามารถส่งคำขอเช่าได้", 500);
  }

  return apiSuccess({ message: "ส่งคำขอเช่าสำเร็จ", order: data }, 201);
}
