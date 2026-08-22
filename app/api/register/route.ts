import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/register";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const { username, password, nationalId, role } = validation.data;
    const admin = createAdminClient();

    // 2. Check if username or national_id already exists in useraccount
    const { data: existingUser, error: checkError } = await admin
      .from("useraccount")
      .select("username, national_id")
      .or(`username.eq.${username},national_id.eq.${nationalId}`)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล" },
        { status: 500 }
      );
    }

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" },
          { status: 409 }
        );
      }
      if (existingUser.national_id === nationalId) {
        return NextResponse.json(
          { message: "เลขบัตรประชาชนนี้ถูกใช้งานแล้ว" },
          { status: 409 }
        );
      }
    }

    // 3. Derive deterministic email identifier for Supabase Auth
    const email = `${username.toLowerCase().trim()}@chaochao.local`;

    // 4. Create user in Supabase Auth (Triggers handle_new_auth_user in DB automatically)
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          signup_role: role,
          role,
          national_id: nationalId,
        },
      });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { message: authError?.message || "ไม่สามารถสร้างบัญชีผู้ใช้ได้" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 5. Update national_id and active status in public.useraccount
    await admin
      .from("useraccount")
      .update({
        national_id: nationalId,
        status: "Active",
      })
      .eq("user_id", userId);

    return NextResponse.json(
      {
        message: "สมัครสมาชิกสำเร็จ",
        user: { id: userId, username, role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}