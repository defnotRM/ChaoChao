import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "ไม่พบไฟล์รูปภาพที่ต้องการอัปโหลด" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "ขนาดไฟล์ต้องไม่เกิน 5 MB" },
        { status: 400 }
      );
    }

    // Convert file to Base64 Data URI for storage in useraccount table only
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/png";
    const base64DataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const admin = createAdminClient();

    // 1. Store the image in useraccount.avatar_url
    const { error: dbError } = await admin
      .from("useraccount")
      .update({
        avatar_url: base64DataUri,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (dbError) {
      console.error("useraccount update error:", dbError);
      return NextResponse.json(
        { message: "ไม่สามารถบันทึกข้อมูลรูปโปรไฟล์ลงในฐานข้อมูลได้" },
        { status: 500 }
      );
    }

    // 2. In auth.users metadata, only store the short URL to keep JWT session cookies small
    const shortAvatarUrl = `/api/avatar?id=${user.id}`;
    const userMetadata = {
      ...(user.user_metadata || {}),
      avatar_url: shortAvatarUrl,
    };

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: userMetadata,
    });

    const timestampedUrl = `/api/avatar?id=${user.id}&t=${Date.now()}`;

    return NextResponse.json({
      message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
      avatarUrl: timestampedUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" },
      { status: 500 }
    );
  }
}
