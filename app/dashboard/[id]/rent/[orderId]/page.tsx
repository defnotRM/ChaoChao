import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import RentOrderDetailClient, { type RentOrderDetailData } from "./RentOrderDetailClient";

export const dynamic = "force-dynamic";

export default async function UserRentalOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>;
}) {
  const { id: userId, orderId } = await params;
  const admin = createAdminClient();

  // 1. ดึงข้อมูลคำสั่งเช่า
  const { data: order, error } = await admin
    .from("rentalorder")
    .select(
      "order_id, item_id, user_id, meetup_location, return_location, start_date, end_date, rental_fee, deposit, total_paid, status, created_at, updated_at"
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  // 2. ดึงข้อมูลสินค้า, รูปภาพสินค้า, เงื่อนไขสินค้า, และประวัติการชำระเงิน
  const [itemRes, imageRes, condRes, paymentsRes] = await Promise.all([
    admin
      .from("item")
      .select("item_name, rental_fee_per_day, deposit, user_id")
      .eq("item_id", order.item_id)
      .maybeSingle(),
    admin
      .from("itemimage")
      .select("image_url, is_primary, sequence")
      .eq("item_id", order.item_id)
      .order("sequence", { ascending: true }),
    admin
      .from("itemcondition")
      .select("seq, condition")
      .eq("item_id", order.item_id)
      .order("seq", { ascending: true }),
    admin
      .from("payment")
      .select("payment_id, amount, status, slip_image_url, date")
      .eq("order_id", orderId),
  ]);

  const item = itemRes.data;
  if (!item) {
    notFound();
  }

  const ownerId = item.user_id ?? "";
  const ownerRes = ownerId
    ? await admin
        .from("useraccount")
        .select("firstname, lastname, username, status")
        .eq("user_id", ownerId)
        .maybeSingle()
    : { data: null };

  const owner = ownerRes.data;
  const ownerName =
    [owner?.firstname, owner?.lastname].filter(Boolean).join(" ").trim() ||
    owner?.username ||
    "ผู้ให้เช่า";

  const primaryImage =
    imageRes.data?.find((i) => i.is_primary)?.image_url ??
    imageRes.data?.[0]?.image_url ??
    null;

  const conditions = (condRes.data || [])
    .map((c) => c.condition)
    .filter((c): c is string => Boolean(c && c.trim()));

  const data: RentOrderDetailData = {
    order: {
      order_id: order.order_id,
      item_id: order.item_id,
      user_id: order.user_id,
      meetup_location: order.meetup_location,
      return_location: order.return_location,
      start_date: order.start_date,
      end_date: order.end_date,
      rental_fee: Number(order.rental_fee) || 0,
      deposit: Number(order.deposit) || 0,
      total_paid: Number(order.total_paid) || 0,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    },
    item: {
      id: order.item_id,
      name: item.item_name,
      rentalFeePerDay: Number(item.rental_fee_per_day) || 0,
      deposit: Number(item.deposit) || 0,
      imageUrl: primaryImage,
      conditions,
    },
    owner: {
      id: ownerId,
      name: ownerName,
      status: owner?.status || "Active",
    },
    payments: (paymentsRes.data || []).map((p) => ({
      payment_id: p.payment_id,
      amount: Number(p.amount) || 0,
      status: p.status,
      slip_image_url: p.slip_image_url || null,
      date: p.date,
    })),
  };

  return <RentOrderDetailClient data={data} userId={userId} />;
}
