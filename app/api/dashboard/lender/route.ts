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

    let userId = user?.id;
    if (!userId) {
      const { data: firstUser } = await admin
        .from("useraccount")
        .select("user_id")
        .limit(1)
        .maybeSingle();
      userId = firstUser?.user_id || "a1111111-1111-1111-1111-111111111111";
    }

    // 1. ดึงรายการสินค้าทั้งหมดที่ผู้ให้เช่าคนนี้ลงประกาศไว้
    const { data: items, error: itemsError } = await admin
      .from("item")
      .select(`
        item_id,
        item_name,
        description,
        rental_fee_per_day,
        deposit,
        status,
        created_at,
        category:category_id (
          category_name
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (itemsError) {
      console.error("Error fetching lender items:", itemsError);
    }

    const itemList = items || [];
    const itemIds = itemList.map((i) => i.item_id);

    // 2. ดึงคำขอเช่า/คำสั่งเช่าทั้งหมดที่ส่งเข้ามายังสินค้าของผู้ให้เช่าคนนี้
    let incomingOrders: any[] = [];
    if (itemIds.length > 0) {
      const { data: orders, error: ordersError } = await admin
        .from("rentalorder")
        .select(`
          order_id,
          item_id,
          user_id,
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
            item_name
          ),
          renter:user_id (
            username,
            avatar_url,
            phone
          )
        `)
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      if (!ordersError && orders) {
        incomingOrders = orders;
      }
    }

    // 3. คำนวณสรุปสถิติสำหรับผู้ให้เช่า
    const totalItems = itemList.length;
    const availableItems = itemList.filter((i) => i.status === "available").length;
    const rentedItems = itemList.filter((i) => i.status === "rented").length;
    const pendingRequests = incomingOrders.filter((o) => o.status === "requested" || o.status === "awaiting_payment").length;
    
    const estimatedIncome = incomingOrders
      .filter((o) => o.status === "paid" || o.status === "completed" || o.status === "item_sent")
      .reduce((sum, o) => sum + (Number(o.rental_fee) || Number(o.total_paid) || 0), 0);

    return NextResponse.json({
      items: itemList,
      incomingOrders,
      metrics: {
        totalItems,
        availableItems,
        rentedItems,
        pendingRequests,
        estimatedIncome,
      },
    });
  } catch (err) {
    console.error("Error in /api/dashboard/lender:", err);
    return NextResponse.json(
      {
        items: [],
        incomingOrders: [],
        metrics: { totalItems: 0, availableItems: 0, rentedItems: 0, pendingRequests: 0, estimatedIncome: 0 },
      },
      { status: 500 }
    );
  }
}
