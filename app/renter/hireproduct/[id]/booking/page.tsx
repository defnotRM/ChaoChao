import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import BookingClient from "./BookingClient";
import type { BookingLocation, BookingPageData, DateRange } from "./types";

// ข้อมูลมาจาก DB ตอน request จริง (มีออเดอร์/คิวว่างที่เปลี่ยนได้) → ไม่ prerender
export const dynamic = "force-dynamic";

// สถานะออเดอร์ที่ยัง "กันคิว" อยู่ (ตรงกับ exclusion constraint no_overlapping_active_bookings)
const ACTIVE_ORDER_STATUSES = [
  "requested",
  "awaiting_payment",
  "paid",
  "item_sent",
];

function formatFullAddress(location: {
  no: string | null;
  alley: string | null;
  road: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
}) {
  return [
    location.no === "-" ? null : location.no,
    location.alley,
    location.road,
    location.subdistrict,
    location.district,
    location.province,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ");
}

export default async function BookingPage({
  params,
}: PageProps<"/renter/hireproduct/[id]/booking">) {
  const { id } = await params;

  const admin = createAdminClient();

  // 1) สินค้า — ไม่พบ → 404
  const { data: item, error: itemError } = await admin
    .from("item")
    .select("item_id, user_id, item_name, rental_fee_per_day, deposit, status")
    .eq("item_id", id)
    .maybeSingle();

  if (itemError || !item) {
    notFound();
  }

  // 2) เจ้าของ / จุดนัด / คิวว่าง / รูป / ออเดอร์ที่กันคิว — ดึงขนานกัน
  const [ownerRes, locationsRes, availabilityRes, imageRes, ordersRes, reviewRes] =
    await Promise.all([
      admin
        .from("useraccount")
        .select("username, firstname, lastname, status, created_at")
        .eq("user_id", item.user_id)
        .maybeSingle(),
      admin
        .from("itemlocation")
        .select("location_id, description, no, alley, road, subdistrict, district, province")
        .eq("item_id", id),
      admin
        .from("availability")
        .select("start_date, end_date")
        .eq("item_id", id)
        .order("start_date", { ascending: true }),
      admin
        .from("itemimage")
        .select("image_url, is_primary, sequence")
        .eq("item_id", id)
        .order("sequence", { ascending: true }),
      // อ่านช่วงที่ถูกจองด้วย admin (RLS ปกติเห็นเฉพาะออเดอร์ของตัวเอง)
      admin
        .from("rentalorder")
        .select("start_date, end_date, status, order_id")
        .eq("item_id", id)
        .in("status", ACTIVE_ORDER_STATUSES),
      // เรตติ้งสินค้า: review join ผ่าน rentalorder.order_id ของชิ้นนี้
      admin
        .from("review")
        .select("rating, order:order_id!inner ( item_id )")
        .eq("order.item_id", id),
    ]);

  const owner = ownerRes.data;
  const ownerName =
    [owner?.firstname, owner?.lastname].filter(Boolean).join(" ").trim() ||
    owner?.username ||
    "ผู้ให้เช่า";

  const locations: BookingLocation[] = (locationsRes.data || []).map((loc) => ({
    id: loc.location_id,
    description: loc.description || "จุดนัดรับ",
    fullAddress: formatFullAddress(loc),
  }));

  const availability: DateRange[] = (availabilityRes.data || []).map((a) => ({
    start: a.start_date,
    end: a.end_date,
  }));

  const bookedRanges: DateRange[] = (ordersRes.data || []).map((o) => ({
    start: o.start_date,
    end: o.end_date,
  }));

  const primaryImage =
    (imageRes.data || []).find((img) => img.is_primary)?.image_url ||
    imageRes.data?.[0]?.image_url ||
    null;

  const reviews = reviewRes.data || [];
  const rating =
    reviews.length > 0
      ? {
          average:
            reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            reviews.length,
          count: reviews.length,
        }
      : null;

  const data: BookingPageData = {
    item: {
      id: item.item_id,
      name: item.item_name,
      rentalFeePerDay: Number(item.rental_fee_per_day) || 0,
      deposit: Number(item.deposit) || 0,
      status: item.status,
      imageUrl: primaryImage,
    },
    owner: {
      displayName: ownerName,
      isVerified: owner?.status === "Active",
      joinedAt: owner?.created_at ?? new Date().toISOString(),
    },
    locations,
    availability,
    bookedRanges,
    rating,
  };

  return <BookingClient data={data} />;
}
