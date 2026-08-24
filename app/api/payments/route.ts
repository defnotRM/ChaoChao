import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// seed renter "mint" — แทน auth.uid() เพราะแอป bypass login (ดู app/api/rentals/route.ts)
const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const slip = formData.get("slip") as File | null;
    const orderId = (formData.get("orderId") as string | null)?.trim() ?? "";
    const amountRaw = formData.get("amount") as string | null;
    const transferDate = (formData.get("transferDate") as string | null)?.trim() ?? "";
    const transactionRef =
      (formData.get("transactionRef") as string | null)?.trim() || null;

    const amount = Number(amountRaw);

    // 1) validate
    if (!orderId || !slip) {
      return NextResponse.json(
        { message: "กรุณาแนบสลิปและระบุออเดอร์" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(slip.type)) {
      return NextResponse.json(
        { message: "ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPG, PNG หรือ PDF" },
        { status: 400 }
      );
    }
    if (slip.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "ขนาดไฟล์ต้องไม่เกิน 10 MB" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "จำนวนเงินที่โอนไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 2) ตรวจออเดอร์ต้องมีจริง + เป็นของผู้เช่า + รอชำระเงิน
    const { data: order, error: orderError } = await admin
      .from("rentalorder")
      .select("order_id, user_id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ message: "ไม่พบออเดอร์นี้" }, { status: 404 });
    }
    if (order.user_id !== RENTER_ID) {
      return NextResponse.json(
        { message: "ออเดอร์นี้ไม่ใช่ของคุณ" },
        { status: 403 }
      );
    }
    if (order.status !== "awaiting_payment") {
      return NextResponse.json(
        { message: "ออเดอร์นี้ไม่อยู่ในสถานะรอชำระเงิน" },
        { status: 400 }
      );
    }

    // กันซ้ำ: มีสลิปที่รอตรวจอยู่แล้ว
    const { data: existing } = await admin
      .from("payment")
      .select("payment_id")
      .eq("order_id", orderId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "มีสลิปที่รอตรวจสอบอยู่แล้วสำหรับออเดอร์นี้" },
        { status: 409 }
      );
    }

    // 3) แปลงไฟล์เป็น base64 data URI (แพทเทิร์นเดียวกับ app/api/profile/avatar/route.ts)
    const buffer = Buffer.from(await slip.arrayBuffer());
    const mimeType = slip.type || "image/png";
    const slipDataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // 4) INSERT payment (status pending รอแอดมินตรวจ)
    const { data: payment, error: paymentError } = await admin
      .from("payment")
      .insert({
        order_id: orderId,
        user_id: RENTER_ID,
        amount,
        date: transferDate || new Date().toISOString(),
        slip_image_url: slipDataUri,
        transaction_ref: transactionRef,
        status: "pending",
      })
      .select("payment_id")
      .single();

    if (paymentError) {
      console.error("Insert payment error:", paymentError);
      return NextResponse.json(
        { message: "บันทึกการชำระเงินไม่สำเร็จ กรุณาลองใหม่" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { paymentId: payment.payment_id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
