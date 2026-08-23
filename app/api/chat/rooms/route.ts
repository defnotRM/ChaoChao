import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch all chat rooms where user is participant
    const { data: rooms, error: roomsError } = await admin
      .from("chatroom")
      .select("chat_room_id, renter_id, lender_id, last_message, updated_at, created_at")
      .or(`renter_id.eq.${user.id},lender_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (roomsError) {
      console.error("Error fetching rooms:", roomsError);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาดในการโหลดรายการแชท" },
        { status: 500 }
      );
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { rooms: [] },
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    // Collect all partner IDs
    const partnerIds = Array.from(
      new Set(
        rooms.map((r) => (r.renter_id === user.id ? r.lender_id : r.renter_id))
      )
    );

    // 2. Fetch partners profiles
    const { data: profiles } = await admin
      .from("useraccount")
      .select("user_id, username, avatar_url, updated_at, status")
      .in("user_id", partnerIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    // 3. Fetch partners roles
    const { data: roleAssignments } = await admin
      .from("user_role_assignment")
      .select("user_id, role:role_id ( role_type )")
      .in("user_id", partnerIds);

    const rolesMap = new Map<string, string[]>();
    (roleAssignments || []).forEach((ra: any) => {
      const current = rolesMap.get(ra.user_id) || [];
      if (ra.role?.role_type) current.push(ra.role.role_type);
      rolesMap.set(ra.user_id, current);
    });

    // 4. Count unread messages for each room
    const roomIds = rooms.map((r) => r.chat_room_id);
    const { data: unreadRows } = await admin
      .from("message")
      .select("chat_room_id")
      .in("chat_room_id", roomIds)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    const unreadCountMap = new Map<string, number>();
    (unreadRows || []).forEach((row) => {
      unreadCountMap.set(
        row.chat_room_id,
        (unreadCountMap.get(row.chat_room_id) || 0) + 1
      );
    });

    // Assemble formatted room objects
    const formattedRooms = rooms.map((r) => {
      const partnerId =
        r.renter_id === user.id ? r.lender_id : r.renter_id;
      const partnerProfile = profileMap.get(partnerId);
      const partnerRoles = rolesMap.get(partnerId) || [];

      const roleLabel = partnerRoles.includes("admin")
        ? "ผู้ดูแลระบบ"
        : partnerRoles.includes("lender")
        ? "ผู้ให้เช่า"
        : "ผู้เช่า";

      const v = partnerProfile?.updated_at
        ? new Date(partnerProfile.updated_at).getTime()
        : Date.now();

      return {
        id: r.chat_room_id,
        lastMessage: r.last_message || "",
        updatedAt: r.updated_at,
        createdAt: r.created_at,
        unreadCount: unreadCountMap.get(r.chat_room_id) || 0,
        partner: {
          id: partnerId,
          username: partnerProfile?.username || "ผู้ใช้งาน",
          avatarUrl: partnerProfile?.avatar_url
            ? `/api/avatar?id=${partnerId}&v=${v}`
            : null,
          role: roleLabel,
          status: partnerProfile?.status || "Active",
        },
      };
    });

    return NextResponse.json(
      { rooms: formattedRooms },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Chat rooms GET error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" },
        { status: 401 }
      );
    }

    const { partnerId } = await request.json();

    if (!partnerId) {
      return NextResponse.json(
        { message: "กรุณาระบุคู่สนทนา" },
        { status: 400 }
      );
    }

    if (partnerId === user.id) {
      return NextResponse.json(
        { message: "ไม่สามารถสร้างห้องแชทกับตัวเองได้" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify partner exists
    const { data: partnerUser, error: partnerError } = await admin
      .from("useraccount")
      .select("user_id")
      .eq("user_id", partnerId)
      .maybeSingle();

    if (partnerError || !partnerUser) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคู่สนทนา" },
        { status: 404 }
      );
    }

    // Check if room already exists
    const { data: existingRoom } = await admin
      .from("chatroom")
      .select("chat_room_id, renter_id, lender_id, last_message, updated_at")
      .or(
        `and(renter_id.eq.${user.id},lender_id.eq.${partnerId}),and(renter_id.eq.${partnerId},lender_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existingRoom) {
      return NextResponse.json({
        roomId: existingRoom.chat_room_id,
        isNew: false,
      });
    }

    // Create new room
    const { data: newRoom, error: createError } = await admin
      .from("chatroom")
      .insert({
        renter_id: user.id,
        lender_id: partnerId,
        last_message: "",
      })
      .select("chat_room_id")
      .single();

    if (createError || !newRoom) {
      console.error("Error creating chat room:", createError);
      return NextResponse.json(
        { message: "ไม่สามารถสร้างห้องสนทนาได้" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        roomId: newRoom.chat_room_id,
        isNew: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Chat rooms POST error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
