import { createClient } from "./server";
import { createAdminClient } from "./admin";

export type UserRole = "renter" | "lender" | "admin";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  username: string;
  national_id: string | null;
  status: string;
  roles: UserRole[];
};

/**
 * Retrieves the currently authenticated user along with their profile and assigned roles.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const admin = createAdminClient();

    // Fetch profile and role assignments
    const { data: profile } = await admin
      .from("useraccount")
      .select("user_id, username, email, national_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: roleAssignments } = await admin
      .from("user_role_assignment")
      .select("role:role_id ( role_type )")
      .eq("user_id", user.id);

    const roles: UserRole[] = (roleAssignments || [])
      .map((item: any) => item.role?.role_type)
      .filter(Boolean) as UserRole[];

    return {
      id: user.id,
      email: user.email ?? profile?.email ?? null,
      username: profile?.username ?? (user.user_metadata?.username || user.email?.split("@")[0] || "User"),
      national_id: profile?.national_id ?? null,
      status: profile?.status ?? "Active",
      roles,
    };
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}
