import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    let query = admin
      .from("useraccount")
      .select("user_id, username, avatar_url, updated_at, status")
      .neq("user_id", user.id)
      .limit(10);

    if (q) {
      query = query.ilike("username", `%${q}%`);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error("Error searching users:", usersError);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาดในการค้นหาผู้ใช้" },
        { status: 500 }
      );
    }

    const userIds = (users || []).map((u) => u.user_id);

    // Fetch roles
    const { data: roleAssignments } = await admin
      .from("user_role_assignment")
      .select("user_id, role:role_id ( role_type )")
      .in("user_id", userIds);

    const rolesMap = new Map<string, string[]>();
    (roleAssignments || []).forEach((ra: any) => {
      const current = rolesMap.get(ra.user_id) || [];
      if (ra.role?.role_type) current.push(ra.role.role_type);
      rolesMap.set(ra.user_id, current);
    });

    const formatted = (users || []).map((u) => {
      const roles = rolesMap.get(u.user_id) || [];
      const roleLabel = roles.includes("admin")
        ? "ผู้ดูแลระบบ"
        : roles.includes("lender")
        ? "ผู้ให้เช่า"
        : "ผู้เช่า";

      const v = u.updated_at
        ? new Date(u.updated_at).getTime()
        : Date.now();

      return {
        id: u.user_id,
        username: u.username,
        avatarUrl: u.avatar_url ? `/api/avatar?id=${u.user_id}&v=${v}` : null,
        role: roleLabel,
        status: u.status,
      };
    });

    return NextResponse.json(
      { users: formatted },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
