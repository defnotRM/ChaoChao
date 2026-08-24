// Serializable props passed from the booking Server Component to BookingClient.
// Dates are plain "YYYY-MM-DD" strings so they survive the server→client boundary.

export interface BookingLocation {
  id: string;
  description: string;
  fullAddress: string;
}

// A closed [start, end] inclusive range of days (matches the DB daterange '[]').
export interface DateRange {
  start: string;
  end: string;
}

export interface BookingItem {
  id: string;
  name: string;
  rentalFeePerDay: number;
  deposit: number;
  status: string;
  imageUrl: string | null;
}

export interface BookingOwner {
  displayName: string;
  isVerified: boolean;
  joinedAt: string;
}

export interface BookingPageData {
  item: BookingItem;
  owner: BookingOwner;
  // จุดนัดรับ–คืน (ปัจจุบัน 1 จุด/ชิ้น แต่รองรับหลายจุด)
  locations: BookingLocation[];
  // ช่วงวันที่เปิดให้จอง (availability)
  availability: DateRange[];
  // ช่วงที่ถูกจองไปแล้ว (rentalorder ที่ยัง active) — ดึงด้วย admin client เลี่ยง RLS
  bookedRanges: DateRange[];
  // เรตติ้งสินค้าคำนวณจาก review; null = ยังไม่มีรีวิว → ซ่อน
  rating: { average: number; count: number } | null;
}

// รูปทรงของ payload ที่ประกอบไว้ให้ Step ถัดไป (ส่งคำขอ) — ตรงกับ schema rentalorder
export interface BookingDraft {
  item_id: string;
  user_id: string | null; // bypass login: ยังไม่มี auth.uid() ในขั้นนี้
  start_date: string;
  end_date: string;
  meetup_location: string;
  return_location: string;
  rental_fee: number;
  deposit: number;
  total_paid: number;
  fee: number;
  net_income: number;
  status: "requested";
}
