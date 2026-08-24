import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function HiredProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  // Find order and the owner of the item
  const { data: order, error } = await admin
    .from("rentalorder")
    .select("order_id, item:item_id ( user_id )")
    .eq("order_id", id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const ownerId = (order.item as any)?.user_id || "b5041d3d-ba07-4230-96fa-3fbfb4411439";
  redirect(`/dashboard/${ownerId}/lend/${order.order_id}`);
}
