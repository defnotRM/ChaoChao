import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    let orderId = "";
    let amount = 0;
    let transferDate = new Date().toISOString();
    let transactionRef: string | null = null;
    let slipDataUri: string | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await request.json();
      orderId = json.orderId || "";
      amount = Number(json.amount) || 0;
      transferDate = json.transferDate || new Date().toISOString();
      transactionRef = json.transactionRef || null;
      slipDataUri = json.slipImageUrl || null;
    } else {
      const formData = await request.formData();
      const slip = formData.get("slip") as File | null;
      orderId = (formData.get("orderId") as string | null)?.trim() ?? "";
      const amountRaw = formData.get("amount") as string | null;
      transferDate = (formData.get("transferDate") as string | null)?.trim() ?? new Date().toISOString();
      transactionRef = (formData.get("transactionRef") as string | null)?.trim() || null;
      amount = Number(amountRaw);

      if (slip) {
        if (!ALLOWED_TYPES.includes(slip.type)) {
          return NextResponse.json(
            { message: "ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPG, PNG หรือ WebP" },
            { status: 400 }
          );
        }
        if (slip.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { message: "ขนาดไฟล์ต้องไม่เกิน 10 MB" },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await slip.arrayBuffer());
        const mimeType = slip.type || "image/png";
        slipDataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    if (!orderId) {
      return NextResponse.json(
        { message: "กรุณาระบุเลขออเดอร์" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 2) ตรวจออเดอร์ต้องมีจริง
    const { data: order, error: orderError } = await admin
      .from("rentalorder")
      .select("order_id, user_id, status, total_paid, rental_fee, deposit")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ message: "ไม่พบออเดอร์นี้" }, { status: 404 });
    }
    if (order.status !== "awaiting_payment" && order.status !== "requested") {
      return NextResponse.json(
        { message: "ออเดอร์นี้ไม่อยู่ในสถานะรอชำระเงิน" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      amount = Number(order.total_paid) || (Number(order.rental_fee) + Number(order.deposit)) || 0;
    }

    // Default mock slip image if not provided
    if (!slipDataUri) {
      slipDataUri = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60";
    }

    // 3) ลบหรืออัปเดตสลิปเดิมหากมี
    await admin
      .from("payment")
      .delete()
      .eq("order_id", orderId)
      .eq("status", "pending");

    // 4) INSERT payment (status pending รอผู้ให้เช่าตรวจ)
    const { data: payment, error: paymentError } = await admin
      .from("payment")
      .insert({
        order_id: orderId,
        user_id: order.user_id,
        amount,
        date: transferDate,
        slip_image_url: slipDataUri,
        transaction_ref: transactionRef || `TXN-${Date.now().toString().slice(-8)}`,
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

    // ตรวจสอบสถานะ order ให้อยู่ใน awaiting_payment
    if (order.status !== "awaiting_payment") {
      await admin
        .from("rentalorder")
        .update({ status: "awaiting_payment", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);
    }

    return NextResponse.json(
      { paymentId: payment.payment_id, message: "อัปโหลดสลิปเรียบร้อยแล้ว รอผู้ให้เช่าตรวจสอบ" },
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
