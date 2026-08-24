import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import LendOrderDetailClient, { type LendOrderData } from "./LendOrderDetailClient";

export const dynamic = "force-dynamic";

export default async function LenderOrderDetailPage({
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

  // 2. ดึงข้อมูลสินค้า, รูปสินค้า, ผู้เช่า, เบอร์โทรผู้เช่า, และการชำระเงิน
  const [itemRes, imageRes, renterRes, phoneRes, paymentsRes] = await Promise.all([
    admin
      .from("item")
      .select("item_id, item_name, rental_fee_per_day, deposit, user_id")
      .eq("item_id", order.item_id)
      .maybeSingle(),
    admin
      .from("itemimage")
      .select("image_url, is_primary, sequence")
      .eq("item_id", order.item_id)
      .order("sequence", { ascending: true }),
    admin
      .from("useraccount")
      .select("user_id, username, firstname, lastname, email, avatar_url, updated_at")
      .eq("user_id", order.user_id)
      .maybeSingle(),
    admin
      .from("userphones")
      .select("phone")
      .eq("user_id", order.user_id)
      .limit(1)
      .maybeSingle(),
    admin
      .from("payment")
      .select("payment_id, amount, status")
      .eq("order_id", orderId),
  ]);

  const item = itemRes.data;
  if (!item) {
    notFound();
  }

  const primaryImage =
    imageRes.data?.find((i) => i.is_primary)?.image_url ??
    imageRes.data?.[0]?.image_url ??
    null;

  const renter = renterRes.data;
  const renterFullName =
    [renter?.firstname, renter?.lastname].filter(Boolean).join(" ").trim() ||
    renter?.username ||
    "ผู้เช่า";

  const v = renter?.updated_at
    ? new Date(renter.updated_at).getTime()
    : Date.now();
  const avatarUrl = renter?.avatar_url
    ? `/api/avatar?id=${renter.user_id}&v=${v}`
    : null;

  const data: LendOrderData = {
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
      id: item.item_id,
      name: item.item_name,
      rentalFeePerDay: Number(item.rental_fee_per_day) || 0,
      deposit: Number(item.deposit) || 0,
      imageUrl: primaryImage,
    },
    renter: {
      id: order.user_id,
      username: renter?.username || "renter",
      fullName: renterFullName,
      email: renter?.email || null,
      phone: phoneRes.data?.phone || null,
      avatarUrl,
    },
    payments: (paymentsRes.data || []).map((p) => ({
      payment_id: p.payment_id,
      amount: Number(p.amount) || 0,
      status: p.status,
    })),
  };

  return <LendOrderDetailClient data={data} userId={userId} />;
}
