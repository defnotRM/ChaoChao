import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// seed renter "mint" — แทน auth.uid() เพราะแอป bypass login
const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

// จำลอง "แอดมินอนุมัติสลิป" (ยังไม่มีระบบแอดมินจริง):
// ตั้ง payment ที่ pending → paid และ rentalorder → paid ให้ flow เดินต่อได้
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
    if (order.user_id !== RENTER_ID) {
      return NextResponse.json({ message: "ออเดอร์นี้ไม่ใช่ของคุณ" }, { status: 403 });
    }

    // idempotent: อนุมัติเฉพาะตอนยังรอชำระเงิน
    if (order.status === "awaiting_payment") {
      await admin
        .from("payment")
        .update({ status: "paid" })
        .eq("order_id", orderId)
        .eq("status", "pending");

      const { error: orderErr } = await admin
        .from("rentalorder")
        .update({ status: "paid" })
        .eq("order_id", orderId);

      if (orderErr) {
        console.error("approve order update error:", orderErr);
        return NextResponse.json(
          { message: "อัปเดตสถานะไม่สำเร็จ" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, status: "paid" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/payments/approve error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
