import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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
    const file = formData.get("banner") as File | null;

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

    // Convert file to Base64 Data URI for storage in useraccount table
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";
    const base64DataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const admin = createAdminClient();

    // Store in useraccount.banner_url
    const { error: dbError } = await admin
      .from("useraccount")
      .update({
        banner_url: base64DataUri,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (dbError) {
      console.error("useraccount banner update error:", dbError);
      return NextResponse.json(
        { message: "ไม่สามารถบันทึกรูปภาพแบนเนอร์ลงในฐานข้อมูลได้" },
        { status: 500 }
      );
    }

    const timestampedUrl = `/api/banner?id=${user.id}&t=${Date.now()}`;

    return NextResponse.json({
      message: "อัปโหลดภาพแบนเนอร์สำเร็จ",
      bannerUrl: timestampedUrl,
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการอัปโหลดภาพแบนเนอร์" },
      { status: 500 }
    );
  }
}
