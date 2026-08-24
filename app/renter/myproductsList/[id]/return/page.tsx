import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import ReturnClient, { type ReturnPageData } from "./ReturnClient";

export const dynamic = "force-dynamic";

const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

// เข้าหน้าคืนของได้เมื่อรับของแล้ว (กำลังเช่า) เป็นต้นไป
const ALLOWED = ["item_sent", "item_returned", "awaiting_additional_payment", "completed"];

export default async function ReturnPage({
  params,
}: PageProps<"/renter/myproductsList/[id]/return">) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select("order_id, item_id, user_id, meetup_location, return_location, start_date, end_date, deposit, status")
    .eq("order_id", id)
    .maybeSingle();

  if (error || !order || order.user_id !== RENTER_ID || !ALLOWED.includes(order.status)) {
    notFound();
  }

  const [itemRes, evidenceRes] = await Promise.all([
    admin.from("item").select("item_name, user_id").eq("item_id", order.item_id).maybeSingle(),
    admin
      .from("rentalevidenceimage")
      .select("evidence_type, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const ownerId = itemRes.data?.user_id ?? "";
  const ownerAccount = ownerId
    ? (
        await admin
          .from("useraccount")
          .select("firstname, lastname, username")
          .eq("user_id", ownerId)
          .maybeSingle()
      ).data
    : null;
  const ownerName =
    [ownerAccount?.firstname, ownerAccount?.lastname].filter(Boolean).join(" ").trim() ||
    ownerAccount?.username ||
    "ผู้ปล่อยเช่า";

  const evidence = evidenceRes.data || [];
  const renterRows = evidence.filter((e) => e.evidence_type === "renter_after");
  const lenderRows = evidence.filter((e) => e.evidence_type === "lender_after");

  const data: ReturnPageData = {
    orderId: order.order_id,
    itemName: itemRes.data?.item_name ?? "อุปกรณ์เช่า",
    returnLocation: order.return_location,
    endDate: order.end_date,
    deposit: Number(order.deposit) || 0,
    status: order.status,
    ownerName,
    renterEvidence:
      renterRows.length > 0
        ? { count: renterRows.length, uploadedAt: renterRows[renterRows.length - 1].created_at }
        : null,
    lenderEvidence:
      lenderRows.length > 0
        ? { count: lenderRows.length, uploadedAt: lenderRows[lenderRows.length - 1].created_at }
        : null,
  };

  return <ReturnClient data={data} />;
}
