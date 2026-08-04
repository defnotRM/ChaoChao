import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { username,password, nationalId, role } = await request.json();

  // role กำหนดว่าจะเช็ค/insert ที่ table ไหน
  const tableName = role === "tenant" ? "tenants" : "landlords";

  // 1. เช็ค username ซ้ำ - ต้องเช็คทั้ง 2 table เพราะ username ห้ามซ้ำข้าม role
  const [tenantUsername, landlordUsername] = await Promise.all([
    supabase.from("tenants").select("id").eq("username", username).maybeSingle(),
    supabase.from("landlords").select("id").eq("username", username).maybeSingle(),
  ]);

  if (tenantUsername.data || landlordUsername.data) {
    return NextResponse.json(
      { message: "username นี้ถูกใช้ไปแล้ว" },
      { status: 409 }
    );
  }

  // 2. เช็ค nationalId ซ้ำ - เช็คแค่ table ตาม role ที่เลือก (nationalId ซ้ำข้าม role ได้)
  const { data: existingNationalId } = await supabase
    .from(tableName)
    .select("id")
    .eq("national_id", nationalId)
    .maybeSingle();

  if (existingNationalId) {
    return NextResponse.json(
      { message: "เลขบัตรประชาชนนี้สมัครในฐานะนี้ไปแล้ว" },
      { status: 409 }
    );
  }

  // 3. ผ่านการเช็คทั้งหมดแล้ว - insert ข้อมูลลง table ตาม role
  const { data: newUser, error: insertError } = await supabase
    .from(tableName)
    .insert({
      username,
      password,
      national_id: nationalId,
    })
    .select("id, username")
    .single();

  if (insertError) {
    return NextResponse.json(
      { message: "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "สมัครสมาชิกสำเร็จ", user: newUser },
    { status: 201 }
  );

  
}