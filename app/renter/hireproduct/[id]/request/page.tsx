import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import RequestClient, { type RequestPageData } from "./RequestClient";

export const dynamic = "force-dynamic";

// seed renter "mint" — แทน auth.uid() เพราะแอป bypass login (ดู app/api/rentals/route.ts)
const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

export default async function RequestPage({
  params,
}: PageProps<"/renter/hireproduct/[id]/request">) {
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

  const [ownerRes, renterRes, phoneRes] = await Promise.all([
    admin
      .from("useraccount")
      .select("firstname, lastname, username")
      .eq("user_id", item.user_id)
      .maybeSingle(),
    admin
      .from("useraccount")
      .select("firstname, lastname, email, national_id")
      .eq("user_id", RENTER_ID)
      .maybeSingle(),
    admin
      .from("userphones")
      .select("phone")
      .eq("user_id", RENTER_ID)
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
      email: renter?.email ?? "",
      nationalId: renter?.national_id ?? "",
      phone: phoneRes.data?.phone ?? "",
    },
  };

  return <RequestClient data={data} />;
}
