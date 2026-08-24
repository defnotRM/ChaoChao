import { createAdminClient } from "@/lib/supabase/admin";
import PostProductClient from "./PostProductClient";

export const dynamic = "force-dynamic";

export default async function PostProductPage() {
  const admin = createAdminClient();
  const { data: categories } = await admin
    .from("itemcategory")
    .select("category_id, category_name")
    .order("category_name", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pb-24 sm:pt-8">
      <PostProductClient categories={categories || []} />
    </div>
  );
}
