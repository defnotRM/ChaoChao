import { NextResponse } from "next/server";

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    details !== undefined ? { message, details } : { message },
    { status }
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// แปลง error จาก Postgres exclusion constraint (จองซ้อนกัน) ให้เป็นข้อความที่ user อ่านรู้เรื่อง
// อ้างอิงจาก supabase/migrations/02_example_transactions.sql
export function isBookingConflictError(error: { message?: string } | null) {
  return !!error?.message?.includes("no_overlapping_active_bookings");
}
