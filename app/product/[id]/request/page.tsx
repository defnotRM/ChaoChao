import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import RequestClient, { type RequestPageData } from "./RequestClient";

export const dynamic = "force-dynamic";

export default async function ProductRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: item, error } = await admin
    .from("item")
    .select("item_id, item_name, rental_fee_per_day, deposit, status, user_id")
    .eq("item_id", id)
    .maybeSingle();

  // ไม่พบ หรือไม่พร้อมให้เช่า → 404
  if (error || !item || item.status !== "available") {
    notFound();
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const renterUserId = user?.id || "8a88d60a-e2cf-43a6-b4ea-baa9347bfee1";

  const [ownerRes, renterRes, phoneRes] = await Promise.all([
    admin
      .from("useraccount")
      .select("firstname, lastname, username")
      .eq("user_id", item.user_id)
      .maybeSingle(),
    admin
      .from("useraccount")
      .select("firstname, lastname, email, national_id")
      .eq("user_id", renterUserId)
      .maybeSingle(),
    admin
      .from("userphones")
      .select("phone")
      .eq("user_id", renterUserId)
      .limit(1)
      .maybeSingle(),
  ]);

  const owner = ownerRes.data;
  const renter = renterRes.data;

  const data: RequestPageData = {
    item: {
      id: item.item_id,
      name: item.item_name,
      rentalFeePerDay: Number(item.rental_fee_per_day) || 0,
      deposit: Number(item.deposit) || 0,
    },
    ownerName:
      [owner?.firstname, owner?.lastname].filter(Boolean).join(" ").trim() ||
      owner?.username ||
      "ผู้ให้เช่า",
    renter: {
      firstName: renter?.firstname ?? "",
      lastName: renter?.lastname ?? "",
      email: renter?.email ?? (user?.email || ""),
      nationalId: renter?.national_id ?? "",
      phone: phoneRes.data?.phone ?? "",
    },
  };

  return <RequestClient data={data} />;
}
