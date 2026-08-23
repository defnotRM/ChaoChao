import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ user: null });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("useraccount")
      .select("username, email, avatar_url, updated_at, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: userRoles } = await admin
      .from("user_role_assignment")
      .select("role:role_id ( role_type )")
      .eq("user_id", user.id);

    const roles = (userRoles || [])
      .map((r: any) => r.role?.role_type)
      .filter(Boolean);

    const role =
      roles.includes("admin")
        ? "admin"
        : roles.includes("lender")
        ? "lender"
        : roles.includes("renter")
        ? "renter"
        : user.user_metadata?.role || "renter";

    const v = profile?.updated_at
      ? new Date(profile.updated_at).getTime()
      : Date.now();

    const avatarUrl = profile?.avatar_url
      ? `/api/avatar?id=${user.id}&v=${v}`
      : null;

    return NextResponse.json({
      user: {
        id: user.id,
        username:
          profile?.username ||
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "ผู้ใช้งาน",
        avatarUrl,
        role,
        roles,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null });
  }
}
