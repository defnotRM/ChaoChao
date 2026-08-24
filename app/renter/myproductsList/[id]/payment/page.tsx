import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import PaymentClient, { type PaymentPageData } from "./PaymentClient";

export const dynamic = "force-dynamic";

const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

function orderNo(orderId: string) {
  return `#RNT-${orderId.slice(0, 8).toUpperCase()}`;
}

function inclusiveDays(start: string, end: string) {
  const s = new Date(`${start}T00:00:00Z`).getTime();
  const e = new Date(`${end}T00:00:00Z`).getTime();
  return Math.floor((e - s) / 86_400_000) + 1;
}

export default async function PaymentPage({
  params,
}: PageProps<"/renter/myproductsList/[id]/payment">) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select(
      "order_id, user_id, item_id, start_date, end_date, rental_fee, deposit, total_paid, status"
    )
    .eq("order_id", id)
    .maybeSingle();

  // ต้องเป็นของผู้เช่า + รอชำระเงินเท่านั้น
  if (error || !order || order.user_id !== RENTER_ID || order.status !== "awaiting_payment") {
    notFound();
  }

  const { data: item } = await admin
    .from("item")
    .select("item_name")
    .eq("item_id", order.item_id)
    .maybeSingle();

  const data: PaymentPageData = {
    orderId: order.order_id,
    orderNo: orderNo(order.order_id),
    itemName: item?.item_name ?? "อุปกรณ์เช่า",
    startDate: order.start_date,
    endDate: order.end_date,
    days: inclusiveDays(order.start_date, order.end_date),
    rentalFee: Number(order.rental_fee) || 0,
    deposit: Number(order.deposit) || 0,
    totalPaid: Number(order.total_paid) || 0,
  };

  return <PaymentClient data={data} />;
}
