import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import EditProductClient from "./EditProductClient";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [itemRes, categoriesRes] = await Promise.all([
    admin
      .from("item")
      .select(
        `
          item_id, user_id, category_id, item_name, description,
          original_price, rental_fee_per_day, deposit, status, created_at, updated_at,
          category:category_id ( category_id, category_name ),
          itemlocation ( location_id, description, no, alley, road, subdistrict, district, province ),
          itemcondition ( seq, condition ),
          availability ( availability_id, start_date, end_date )
        `
      )
      .eq("item_id", id)
      .maybeSingle(),
    admin
      .from("itemcategory")
      .select("category_id, category_name")
      .order("category_name", { ascending: true }),
  ]);

  if (itemRes.error || !itemRes.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pb-24 sm:pt-8">
      <EditProductClient
        initialItem={itemRes.data}
        categories={categoriesRes.data || []}
      />
    </div>
  );
}
