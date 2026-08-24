import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DashboardRedirectPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    redirect(`/dashboard/${user.id}`);
  }

  // Fallback to first available user or romanlnw68 when previewing without session
  const admin = createAdminClient();
  const { data: firstUser } = await admin
    .from("useraccount")
    .select("user_id")
    .limit(1)
    .maybeSingle();

  const targetId = firstUser?.user_id || "8a88d60a-e2cf-43a6-b4ea-baa9347bfee1";
  redirect(`/dashboard/${targetId}`);
}
