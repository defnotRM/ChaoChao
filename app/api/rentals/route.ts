import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const NATIONAL_ID_RE = /^\d{13}$/;

type RentalBody = {
  itemId?: string;
  startDate?: string;
  endDate?: string;
  meetupLocation?: string | null;
  returnLocation?: string | null;
  rentalFee?: number | null;
  deposit?: number | null;
  totalPaid?: number | null;
  renter?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RentalBody;
    const {
      itemId,
      startDate,
      endDate,
      meetupLocation,
      returnLocation,
      rentalFee,
      deposit,
      totalPaid,
      renter,
    } = body;

    // 1) validate
    const firstName = renter?.firstName?.trim() ?? "";
    const lastName = renter?.lastName?.trim() ?? "";
    const email = renter?.email?.trim() ?? "";
    const phone = renter?.phone?.trim() ?? "";
    const nationalId = renter?.nationalId?.trim() ?? "";

    if (!itemId || !startDate || !endDate) {
      return NextResponse.json(
        { message: "ข้อมูลคำขอไม่ครบ (สินค้า/ช่วงวันที่)" },
        { status: 400 }
      );
    }
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อ–นามสกุล และเบอร์โทรให้ครบ" },
        { status: 400 }
      );
    }
    if (!NATIONAL_ID_RE.test(nationalId)) {
      return NextResponse.json(
        { message: "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก" },
        { status: 400 }
      );
    }
    if (endDate < startDate) {
      return NextResponse.json(
        { message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Default to romanlnw68 if not logged in
    const renterUserId = user?.id || "8a88d60a-e2cf-43a6-b4ea-baa9347bfee1";

    const admin = createAdminClient();

    // 2) ตรวจสินค้ามีจริงและพร้อมให้เช่า
    const { data: item, error: itemError } = await admin
      .from("item")
      .select("item_id, status")
      .eq("item_id", itemId)
      .maybeSingle();

    if (itemError || !item) {
      return NextResponse.json({ message: "ไม่พบสินค้านี้" }, { status: 404 });
    }
    if (item.status !== "available") {
      return NextResponse.json(
        { message: "สินค้านี้ไม่พร้อมให้เช่าในขณะนี้" },
        { status: 409 }
      );
    }

    // 3) best-effort อัปเดตข้อมูลตัวตนผู้เช่า (ไม่ให้ล้มทั้งคำขอ)
    const warnings: string[] = [];

    const updatePayload: Record<string, any> = {
      firstname: firstName,
      lastname: lastName,
      national_id: nationalId,
    };
    if (email) {
      updatePayload.email = email;
    }

    const { error: profileError } = await admin
      .from("useraccount")
      .update(updatePayload)
      .eq("user_id", renterUserId);

    if (profileError) {
      // อาจเป็น national_id หรือ email ชน unique — ลองบันทึกเฉพาะชื่อ แล้วเตือน
      const { error: nameOnlyError } = await admin
        .from("useraccount")
        .update({ firstname: firstName, lastname: lastName })
        .eq("user_id", renterUserId);
      warnings.push(
        nameOnlyError
          ? "อัปเดตข้อมูลผู้เช่าไม่สำเร็จ"
          : "เลขบัตรประชาชนนี้ถูกใช้กับบัญชีอื่นแล้ว จึงยังไม่ได้บันทึก"
      );
    }

    // upsert เบอร์โทร (PK ผสม user_id+phone) — ลบของเดิมแล้วใส่ใหม่
    await admin.from("userphones").delete().eq("user_id", renterUserId);
    const { error: phoneError } = await admin
      .from("userphones")
      .insert({ user_id: renterUserId, phone });
    if (phoneError) warnings.push("บันทึกเบอร์โทรไม่สำเร็จ");

    // 4) INSERT rentalorder
    const { data: order, error: orderError } = await admin
      .from("rentalorder")
      .insert({
        user_id: renterUserId,
        item_id: itemId,
        start_date: startDate,
        end_date: endDate,
        meetup_location: meetupLocation ?? null,
        return_location: returnLocation ?? null,
        rental_fee: rentalFee ?? null,
        deposit: deposit ?? null,
        total_paid: totalPaid ?? null,
        status: "requested",
      })
      .select("order_id")
      .single();

    if (orderError) {
      // 23P01 = exclusion_violation (no_overlapping_active_bookings)
      if (orderError.code === "23P01") {
        return NextResponse.json(
          { message: "ช่วงวันที่นี้ถูกจองแล้ว กรุณาเลือกช่วงอื่น" },
          { status: 409 }
        );
      }
      console.error("Insert rentalorder error:", orderError);
      return NextResponse.json(
        { message: "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { orderId: order.order_id, warnings },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rentals error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
