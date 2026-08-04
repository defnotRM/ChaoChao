import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { username, password, role } = await request.json();

  const tableName = role === "tenant" ? "tenants" : "landlords";

  // หา user จาก username ใน table ตาม role ที่เลือก
  const { data: user, error } = await supabase
    .from(tableName)
    .select("id, username, password")
    .eq("username", username)
    .maybeSingle();

  // ไม่เจอ username เลย
  if (error || !user) {
    return NextResponse.json(
      { message: "username หรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  }

  // เช็ค password (plain text เทียบตรง ๆ)
  if (user.password !== password) {
    return NextResponse.json(
      { message: "username หรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  }

  // login สำเร็จ - ไม่ส่ง password กลับไปด้วย
  return NextResponse.json(
    {
      message: "เข้าสู่ระบบสำเร็จ",
      user: { id: user.id, username: user.username, role },
    },
    { status: 200 }
  );
}