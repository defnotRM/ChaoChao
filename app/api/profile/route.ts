import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(4, "ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร")
    .max(20, "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร a-z, A-Z, 0-9 และ _"
    ),
  bio: z.string().max(500, "ประวัติย่อต้องไม่เกิน 500 ตัวอักษร").optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  phones: z
    .array(z.string())
    .max(2, "สามารถใส่เบอร์โทรศัพท์ได้สูงสุด 2 เบอร์")
    .optional()
    .nullable(),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function GET() {
  try {
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

    const [profileRes, rolesRes, phonesRes] = await Promise.all([
      admin
        .from("useraccount")
        .select(
          "user_id, username, email, national_id, bio, avatar_url, banner_url, updated_at, status, created_at"
        )
        .eq("user_id", user.id)
        .single(),
      admin
        .from("user_role_assignment")
        .select("role:role_id ( role_type )")
        .eq("user_id", user.id),
      admin
        .from("userphones")
        .select("phone")
        .eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    if (profileRes.error || !profile) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลโปรไฟล์ผู้ใช้" },
        { status: 404 }
      );
    }

    const roles = (rolesRes.data || [])
      .map((item: any) => item.role?.role_type)
      .filter(Boolean);

    const phones = (phonesRes.data || [])
      .map((p: any) => p.phone)
      .filter(Boolean);

    const v = profile.updated_at
      ? new Date(profile.updated_at).getTime()
      : Date.now();

    const avatarUrl = profile.avatar_url
      ? `/api/avatar?id=${user.id}&v=${v}`
      : "";

    const bannerUrl = profile.banner_url
      ? `/api/banner?id=${user.id}&v=${v}`
      : "";

    return NextResponse.json({
      user: {
        id: profile.user_id,
        username: profile.username,
        email: profile.email,
        nationalId: profile.national_id,
        bio: profile.bio ?? "",
        avatarUrl,
        bannerUrl,
        phones,
        status: profile.status,
        roles,
        createdAt: profile.created_at,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
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

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const { username, bio, avatarUrl, bannerUrl, phones, password } = validation.data;
    const admin = createAdminClient();

    // 1. Check if new username is already taken by another user
    const { data: existingUser } = await admin
      .from("useraccount")
      .select("user_id")
      .eq("username", username)
      .neq("user_id", user.id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น" },
        { status: 409 }
      );
    }

    // 2. Update useraccount (username & bio & avatar_url & banner_url)
    const updateData: Record<string, any> = {
      username,
      bio: bio ?? "",
      updated_at: new Date().toISOString(),
    };
    if (avatarUrl === "") {
      updateData.avatar_url = null;
    }
    if (bannerUrl === "") {
      updateData.banner_url = null;
    }

    const { error: updateError } = await admin
      .from("useraccount")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
        { status: 500 }
      );
    }

    // 3. Update userphones (Max 2 phone numbers, or 0/1)
    let updatedPhones: string[] = [];
    if (phones !== undefined && phones !== null) {
      const cleanPhones = Array.from(
        new Set(
          phones
            .map((p) => p.trim())
            .filter((p) => p.length >= 9 && p.length <= 15)
        )
      ).slice(0, 2);

      // Delete existing phones for this user
      await admin.from("userphones").delete().eq("user_id", user.id);

      // Insert new phone numbers (if any)
      if (cleanPhones.length > 0) {
        const phoneRows = cleanPhones.map((phone) => ({
          user_id: user.id,
          phone,
        }));
        const { error: phoneInsertError } = await admin
          .from("userphones")
          .insert(phoneRows);

        if (phoneInsertError) {
          console.error("userphones insert error:", phoneInsertError);
        }
      }
      updatedPhones = cleanPhones;
    } else {
      const { data: currentPhones } = await admin
        .from("userphones")
        .select("phone")
        .eq("user_id", user.id);
      updatedPhones = (currentPhones || []).map((p: any) => p.phone).filter(Boolean);
    }

    // 4. Update auth.users metadata (keep avatar_url short)
    const userMetadata = {
      ...(user.user_metadata || {}),
      username,
      avatar_url:
        avatarUrl === ""
          ? null
          : avatarUrl
          ? `/api/avatar?id=${user.id}`
          : user.user_metadata?.avatar_url,
    };

    if (password && password.trim().length >= 8) {
      const { error: passError } = await admin.auth.admin.updateUserById(
        user.id,
        {
          password: password.trim(),
          user_metadata: userMetadata,
        }
      );

      if (passError) {
        console.error("Password update error:", passError);
        return NextResponse.json(
          { message: "แก้ไขโปรไฟล์สำเร็จ แต่เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" },
          { status: 500 }
        );
      }
    } else {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: userMetadata,
      });
    }

    const now = Date.now();
    return NextResponse.json({
      message: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว",
      user: {
        id: user.id,
        username,
        bio: bio ?? "",
        phones: updatedPhones,
        avatarUrl: avatarUrl === "" ? "" : `/api/avatar?id=${user.id}&v=${now}`,
        bannerUrl: bannerUrl === "" ? "" : `/api/banner?id=${user.id}&v=${now}`,
      },
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
