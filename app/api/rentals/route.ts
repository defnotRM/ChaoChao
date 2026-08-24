import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    if (!itemId || !startDate || !endDate) {
      return NextResponse.json(
        { message: "ข้อมูลคำขอไม่ครบ (สินค้า/ช่วงวันที่)" },
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

    const admin = createAdminClient();

    if (user) {
      const { data: userRoles } = await admin
        .from("user_role_assignment")
        .select("role:role_id ( role_type )")
        .eq("user_id", user.id);

      const roles = (userRoles || [])
        .map((r: any) => r.role?.role_type)
        .filter(Boolean);

      const isLenderOnly =
        roles.includes("lender") &&
        !roles.includes("renter") &&
        !roles.includes("admin");

      if (isLenderOnly) {
        return NextResponse.json(
          { message: "บัญชีของคุณเป็นผู้ให้เช่าเท่านั้น ไม่สามารถส่งคำขอเช่าได้" },
          { status: 403 }
        );
      }
    }

    // Default to romanlnw68 if not logged in
    const renterUserId = user?.id || "8a88d60a-e2cf-43a6-b4ea-baa9347bfee1";

    // 2) ตรวจสินค้ามีจริงและพร้อมให้เช่า
    const { data: item, error: itemError } = await admin
      .from("item")
      .select("item_id, status, rental_fee_per_day, deposit")
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

    // 3) ถ้ามี renter details ส่งมา อัปเดตข้อมูลผู้เช่า
    const warnings: string[] = [];
    if (renter) {
      const firstName = renter?.firstName?.trim() ?? "";
      const lastName = renter?.lastName?.trim() ?? "";
      const email = renter?.email?.trim() ?? "";
      const phone = renter?.phone?.trim() ?? "";
      const nationalId = renter?.nationalId?.trim() ?? "";

      const updatePayload: Record<string, any> = {};
      if (firstName) updatePayload.firstname = firstName;
      if (lastName) updatePayload.lastname = lastName;
      if (nationalId && NATIONAL_ID_RE.test(nationalId)) updatePayload.national_id = nationalId;
      if (email) updatePayload.email = email;

      if (Object.keys(updatePayload).length > 0) {
        await admin
          .from("useraccount")
          .update(updatePayload)
          .eq("user_id", renterUserId);
      }

      if (phone) {
        await admin.from("userphones").delete().eq("user_id", renterUserId);
        await admin.from("userphones").insert({ user_id: renterUserId, phone });
      }
    }

    // คำนวณราคากรณีไม่ได้ส่งมา
    const finalFee = rentalFee ?? item.rental_fee_per_day;
    const finalDeposit = deposit ?? item.deposit;
    const finalTotal = totalPaid ?? (Number(finalFee) + Number(finalDeposit));

    // 4) INSERT rentalorder
    const { data: order, error: orderError } = await admin
      .from("rentalorder")
      .insert({
        user_id: renterUserId,
        item_id: itemId,
        start_date: startDate,
        end_date: endDate,
        meetup_location: meetupLocation ?? "จุดนัดรับที่ตกลงกัน",
        return_location: returnLocation ?? "จุดนัดคืนที่ตกลงกัน",
        rental_fee: finalFee,
        deposit: finalDeposit,
        total_paid: finalTotal,
        status: "requested",
      })
      .select("order_id")
      .single();

    if (orderError) {
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
      { orderId: order.order_id, userId: renterUserId, warnings },
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
