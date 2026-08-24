import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import HandoverClient, { type HandoverPageData } from "./HandoverClient";

export const dynamic = "force-dynamic";

const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

// เข้าหน้ารับของได้เมื่อชำระเงินแล้วเป็นต้นไป
const ALLOWED = ["paid", "item_sent", "item_returned", "awaiting_additional_payment", "completed"];

export default async function HandoverPage({
  params,
}: PageProps<"/renter/myproductsList/[id]/handover">) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select(
      "order_id, item_id, user_id, meetup_location, return_location, start_date, end_date, deposit, status"
    )
    .eq("order_id", id)
    .maybeSingle();

  if (error || !order || order.user_id !== RENTER_ID || !ALLOWED.includes(order.status)) {
    notFound();
  }

  const [itemRes, imageRes, evidenceRes] = await Promise.all([
    admin.from("item").select("item_name, user_id").eq("item_id", order.item_id).maybeSingle(),
    admin
      .from("itemimage")
      .select("image_url, is_primary, sequence")
      .eq("item_id", order.item_id)
      .order("sequence", { ascending: true }),
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
          .select("firstname, lastname, username, status")
          .eq("user_id", ownerId)
          .maybeSingle()
      ).data
    : null;
  const ownerName =
    [ownerAccount?.firstname, ownerAccount?.lastname].filter(Boolean).join(" ").trim() ||
    ownerAccount?.username ||
    "ผู้ปล่อยเช่า";

  const evidence = evidenceRes.data || [];
  const renterRows = evidence.filter((e) => e.evidence_type === "renter_before");
  const lenderRows = evidence.filter((e) => e.evidence_type === "lender_before");

  const primaryImage =
    imageRes.data?.find((i) => i.is_primary)?.image_url ?? imageRes.data?.[0]?.image_url ?? null;

  const data: HandoverPageData = {
    orderId: order.order_id,
    itemName: itemRes.data?.item_name ?? "อุปกรณ์เช่า",
    imageUrl: primaryImage,
    meetupLocation: order.meetup_location,
    returnLocation: order.return_location,
    startDate: order.start_date,
    endDate: order.end_date,
    deposit: Number(order.deposit) || 0,
    status: order.status,
    ownerName,
    ownerId,
    renterEvidence:
      renterRows.length > 0
        ? { count: renterRows.length, uploadedAt: renterRows[renterRows.length - 1].created_at }
        : null,
    lenderEvidence:
      lenderRows.length > 0
        ? { count: lenderRows.length, uploadedAt: lenderRows[lenderRows.length - 1].created_at }
        : null,
  };

  return <HandoverClient data={data} />;
}
