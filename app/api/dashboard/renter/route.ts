import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();

    // หากไม่มี session ให้ดึง user คนแรกเพื่อเป็น fallback ให้พรีวิวได้
    let userId = user?.id;
    if (!userId) {
      const { data: firstUser } = await admin
        .from("useraccount")
        .select("user_id")
        .limit(1)
        .maybeSingle();
      userId = firstUser?.user_id || "a2222222-2222-2222-2222-222222222222";
    }

    // 1. ดึงรายการคำสั่งเช่าของผู้เช่าคนนี้
    const { data: orders, error } = await admin
      .from("rentalorder")
      .select(`
        order_id,
        user_id,
        item_id,
        start_date,
        end_date,
        rental_fee,
        deposit,
        total_paid,
        status,
        meetup_location,
        return_location,
        created_at,
        item:item_id (
          item_id,
          item_name,
          description,
          rental_fee_per_day,
          deposit,
          status,
          user_id,
          lender:user_id (
            username,
            avatar_url
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching renter orders:", error);
      return NextResponse.json({ orders: [], metrics: { active: 0, pending: 0, completed: 0, totalSpent: 0 } });
    }

    const orderList = orders || [];

    // 2. คำนวณสรุปสถิติ
    const activeStatuses = ["requested", "awaiting_payment", "paid", "item_sent", "awaiting_additional_payment"];
    const pendingStatuses = ["requested", "awaiting_payment"];
    const completedStatuses = ["completed", "item_returned"];

    const activeCount = orderList.filter((o) => activeStatuses.includes(o.status)).length;
    const pendingCount = orderList.filter((o) => pendingStatuses.includes(o.status)).length;
    const completedCount = orderList.filter((o) => completedStatuses.includes(o.status)).length;
    const totalSpent = orderList
      .filter((o) => o.status === "paid" || o.status === "completed" || o.status === "item_sent")
      .reduce((sum, o) => sum + (Number(o.total_paid) || Number(o.rental_fee) || 0), 0);

    return NextResponse.json({
      orders: orderList,
      metrics: {
        active: activeCount,
        pending: pendingCount,
        completed: completedCount,
        totalSpent,
      },
    });
  } catch (err) {
    console.error("Error in /api/dashboard/renter:", err);
    return NextResponse.json(
      { orders: [], metrics: { active: 0, pending: 0, completed: 0, totalSpent: 0 } },
      { status: 500 }
    );
  }
}
