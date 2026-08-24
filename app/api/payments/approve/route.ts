import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ผู้ให้เช่า/แอดมินอนุมัติสลิป:
// ปรับ payment ที่ pending → paid และ rentalorder → paid เพื่อให้เข้าสู่ขั้นตอนรับของ
export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId) {
      return NextResponse.json({ message: "ไม่พบออเดอร์" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: order, error } = await admin
      .from("rentalorder")
      .select("order_id, user_id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ message: "ไม่พบออเดอร์นี้" }, { status: 404 });
    }

    // อัปเดต payment เป็น paid
    await admin
      .from("payment")
      .update({ status: "paid" })
      .eq("order_id", orderId)
      .eq("status", "pending");

    // อัปเดต rentalorder เป็น paid
    const { error: orderErr } = await admin
      .from("rentalorder")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("order_id", orderId);

    if (orderErr) {
      console.error("approve order update error:", orderErr);
      return NextResponse.json(
        { message: "อัปเดตสถานะไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, status: "paid", message: "ตรวจสอบการชำระเงินเรียบร้อยแล้ว" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/payments/approve error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
