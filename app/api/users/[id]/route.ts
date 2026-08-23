import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { message: "กรุณาระบุรหัสผู้ใช้งาน" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch user profile
    const { data: user, error: userError } = await admin
      .from("useraccount")
      .select("user_id, username, bio, avatar_url, banner_url, status, updated_at, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลผู้ใช้งานนี้" },
        { status: 404 }
      );
    }

    // 2. Fetch roles
    const { data: roleAssignments } = await admin
      .from("user_role_assignment")
      .select("role:role_id ( role_type )")
      .eq("user_id", userId);

    const roles = (roleAssignments || [])
      .map((ra: any) => ra.role?.role_type)
      .filter(Boolean);

    const isLender = roles.includes("lender");
    const isRenter = roles.includes("renter");
    const isAdmin = roles.includes("admin");

    const roleLabel = isAdmin
      ? "ผู้ดูแลระบบ"
      : isLender && isRenter
      ? "ผู้ให้เช่า / ผู้เช่า"
      : isLender
      ? "ผู้ให้เช่า"
      : "ผู้เช่า";

    // 3. Fetch items listed for rent by this user
    const { data: items } = await admin
      .from("item")
      .select("item_id, item_name, description, rental_fee_per_day, deposit, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Fetch primary images for these items
    const itemIds = (items || []).map((it) => it.item_id);
    let imagesMap = new Map<string, string>();

    if (itemIds.length > 0) {
      const { data: images } = await admin
        .from("itemimage")
        .select("item_id, image_url, is_primary")
        .in("item_id", itemIds);

      (images || []).forEach((img) => {
        if (img.is_primary || !imagesMap.has(img.item_id)) {
          imagesMap.set(img.item_id, img.image_url);
        }
      });
    }

    const formattedItems = (items || []).map((it) => ({
      id: it.item_id,
      name: it.item_name,
      description: it.description || "",
      rentalFeePerDay: it.rental_fee_per_day || 0,
      deposit: it.deposit || 0,
      status: it.status,
      imageUrl: imagesMap.get(it.item_id) || null,
      createdAt: it.created_at,
    }));

    const v = user.updated_at
      ? new Date(user.updated_at).getTime()
      : Date.now();

    return NextResponse.json(
      {
        user: {
          id: user.user_id,
          username: user.username,
          bio: user.bio || "",
          avatarUrl: user.avatar_url ? `/api/avatar?id=${user.user_id}&v=${v}` : null,
          bannerUrl: user.banner_url ? `/api/banner?id=${user.user_id}&v=${v}` : null,
          role: roleLabel,
          isLender,
          isRenter,
          createdAt: user.created_at,
        },
        items: formattedItems,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("User profile GET error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
