import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// seed renter "mint" — แทน auth.uid() เพราะแอป bypass login
const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB/ใบ

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderId = (formData.get("orderId") as string | null)?.trim() ?? "";
    const files = formData.getAll("photos").filter((f): f is File => f instanceof File);

    if (!orderId || files.length === 0) {
      return NextResponse.json(
        { message: "กรุณาแนบรูปหลักฐานอย่างน้อย 1 รูป" },
        { status: 400 }
      );
    }
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        return NextResponse.json(
          { message: "รองรับเฉพาะไฟล์รูป JPG หรือ PNG" },
          { status: 400 }
        );
      }
      if (f.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "ขนาดรูปแต่ละใบต้องไม่เกิน 10 MB" },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("rentalorder")
      .select("order_id, user_id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ message: "ไม่พบออเดอร์นี้" }, { status: 404 });
    }
    if (order.user_id !== RENTER_ID) {
      return NextResponse.json({ message: "ออเดอร์นี้ไม่ใช่ของคุณ" }, { status: 403 });
    }
    if (order.status !== "paid" && order.status !== "item_sent") {
      return NextResponse.json(
        { message: "ยังไม่สามารถอัปโหลดหลักฐานรับของสำหรับออเดอร์นี้ได้" },
        { status: 400 }
      );
    }

    // แปลงทุกไฟล์เป็น base64 data URI แล้ว INSERT (renter_before)
    const rows = await Promise.all(
      files.map(async (f) => {
        const buffer = Buffer.from(await f.arrayBuffer());
        const mime = f.type || "image/png";
        return {
          order_id: orderId,
          user_id: RENTER_ID,
          evidence_type: "renter_before" as const,
          image_url: `data:${mime};base64,${buffer.toString("base64")}`,
        };
      })
    );

    const { error: insertError } = await admin.from("rentalevidenceimage").insert(rows);
    if (insertError) {
      console.error("Insert evidence error:", insertError);
      return NextResponse.json(
        { message: "บันทึกหลักฐานไม่สำเร็จ กรุณาลองใหม่" },
        { status: 500 }
      );
    }

    // รับของแล้ว → เลื่อนสถานะเป็น item_sent (เฉพาะครั้งแรกที่ยัง paid)
    if (order.status === "paid") {
      await admin
        .from("rentalorder")
        .update({ status: "item_sent" })
        .eq("order_id", orderId);
    }

    return NextResponse.json({ count: rows.length }, { status: 201 });
  } catch (error) {
    console.error("POST /api/handover error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
