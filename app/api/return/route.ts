import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB/ใบ

export async function POST(request: Request) {
  try {
    let orderId = "";
    let evidenceType: string = "lender_after";
    let imageUrls: string[] = [];
    let userId: string | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await request.json();
      orderId = json.orderId || "";
      evidenceType = json.evidenceType || "lender_after";
      imageUrls = json.imageUrls || (json.imageUrl ? [json.imageUrl] : []);
      userId = json.userId || null;
    } else {
      const formData = await request.formData();
      orderId = (formData.get("orderId") as string | null)?.trim() ?? "";
      evidenceType = (formData.get("evidenceType") as string | null)?.trim() ?? "lender_after";
      userId = (formData.get("userId") as string | null)?.trim() ?? null;
      const files = formData.getAll("photos").filter((f): f is File => f instanceof File);

      for (const f of files) {
        if (!ALLOWED_TYPES.includes(f.type)) {
          return NextResponse.json(
            { message: "รองรับเฉพาะไฟล์รูป JPG, PNG หรือ WebP" },
            { status: 400 }
          );
        }
        if (f.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { message: "ขนาดรูปแต่ละใบต้องไม่เกิน 10 MB" },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await f.arrayBuffer());
        const mime = f.type || "image/png";
        imageUrls.push(`data:${mime};base64,${buffer.toString("base64")}`);
      }
    }

    if (!orderId) {
      return NextResponse.json(
        { message: "กรุณาระบุเลขออเดอร์" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("rentalorder")
      .select("order_id, user_id, status, item:item_id ( user_id )")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ message: "ไม่พบออเดอร์นี้" }, { status: 404 });
    }

    const uId = userId || (order.item as any)?.user_id || order.user_id;

    if (imageUrls.length === 0) {
      imageUrls = ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60"];
    }

    const rows = imageUrls.map((url) => ({
      order_id: orderId,
      user_id: uId,
      evidence_type: evidenceType,
      image_url: url,
    }));

    const { error: insertError } = await admin.from("rentalevidenceimage").insert(rows);
    if (insertError) {
      console.error("Insert return evidence error:", insertError);
    }

    // ตรวจรับคืนของและบันทึกสภาพหลังเช่าแล้ว → เลื่อนสถานะเป็น completed (เสร็จสมบูรณ์)
    await admin
      .from("rentalorder")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("order_id", orderId);

    return NextResponse.json({
      ok: true,
      count: rows.length,
      status: "completed",
      message: "บันทึกหลักฐานสภาพหลังการใช้งานและเสร็จสิ้นการเช่าเรียบร้อยแล้ว",
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/return error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
