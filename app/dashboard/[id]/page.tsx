import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardUserClient from "./DashboardUserClient";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: userProfile, error: profileError } = await admin
    .from("useraccount")
    .select("user_id, username, firstname, lastname, email, avatar_url, updated_at, status")
    .eq("user_id", id)
    .maybeSingle();

  if (profileError || !userProfile) {
    notFound();
  }

  const { data: userRoles } = await admin
    .from("user_role_assignment")
    .select("role:role_id ( role_type )")
    .eq("user_id", id);

  const roles = (userRoles || [])
    .map((r: any) => r.role?.role_type)
    .filter(Boolean);

  const primaryRole = roles.includes("admin")
    ? "admin"
    : roles.includes("lender")
    ? "lender"
    : "renter";

  const v = userProfile.updated_at
    ? new Date(userProfile.updated_at).getTime()
    : Date.now();

  const avatarUrl = userProfile.avatar_url
    ? `/api/avatar?id=${userProfile.user_id}&v=${v}`
    : null;

  const targetUser = {
    id: userProfile.user_id,
    username:
      userProfile.username ||
      `${userProfile.firstname || ""} ${userProfile.lastname || ""}`.trim() ||
      "ผู้ใช้งาน",
    avatarUrl,
    role: primaryRole,
    roles: roles.length > 0 ? roles : ["renter"],
  };

  return <DashboardUserClient targetUser={targetUser} />;
}
