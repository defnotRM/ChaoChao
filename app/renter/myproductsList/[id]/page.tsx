import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function MyProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select("order_id, user_id")
    .eq("order_id", id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  redirect(`/dashboard/${order.user_id}/rent/${order.order_id}`);
}
