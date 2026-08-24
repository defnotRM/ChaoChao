import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import VerifyingClient from "./VerifyingClient";

export const dynamic = "force-dynamic";

const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

export default async function VerifyingPage({
  params,
}: PageProps<"/renter/myproductsList/[id]/payment/verifying">) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select("order_id, user_id, total_paid")
    .eq("order_id", id)
    .maybeSingle();

  if (error || !order || order.user_id !== RENTER_ID) {
    notFound();
  }

  return (
    <VerifyingClient orderId={order.order_id} totalPaid={Number(order.total_paid) || 0} />
  );
}
