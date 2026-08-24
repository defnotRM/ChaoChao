import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/login";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate inputs
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const { username, password, role } = validation.data;
    const admin = createAdminClient();

    // 2. Lookup user profile in useraccount by username or email
    const { data: profile, error: profileError } = await admin
      .from("useraccount")
      .select("user_id, username, email, status")
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (profile.status === "Suspended" || profile.status === "Banned") {
      return NextResponse.json(
        { message: `บัญชีผู้ใช้ถูกระงับการใช้งาน (${profile.status})` },
        { status: 403 }
      );
    }

    // 3. Resolve user roles from user_role_assignment
    const { data: userRoles, error: roleError } = await admin
      .from("user_role_assignment")
      .select("role:role_id ( role_type )")
      .eq("user_id", profile.user_id);

    if (roleError) {
      console.error("Role lookup error:", roleError);
    }

    const assignedRoles = (userRoles || [])
      .map((item: any) => item.role?.role_type)
      .filter(Boolean);

    // Auto-detect role
    const resolvedRole =
      role && assignedRoles.includes(role)
        ? role
        : assignedRoles.includes("admin")
        ? "admin"
        : assignedRoles.includes("lender")
        ? "lender"
        : assignedRoles.includes("renter")
        ? "renter"
        : "renter";

    // 4. Authenticate using Supabase Auth (stores session in cookies via @supabase/ssr)
    const supabase = await createServerClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

    if (authError || !authData.user) {
      console.error("Auth sign-in error:", authError);
      return NextResponse.json(
        { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // 5. Determine redirection path (เข้าสู่หน้าแดชบอร์ดหลักทันที)
    const redirectTo = "/dashboard";

    const response = NextResponse.json(
      {
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          id: profile.user_id,
          username: profile.username,
          role: resolvedRole,
          roles: assignedRoles,
        },
        redirectTo,
      },
      { status: 200 }
    );

    response.cookies.set("chaochao_active_role", resolvedRole, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}