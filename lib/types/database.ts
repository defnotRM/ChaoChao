// Types ที่ตรงกับ supabase/migrations/01_schema.sql เป๊ะๆ
// ใครแก้ schema แล้วอย่าลืมมาอัปเดตไฟล์นี้ด้วย ไม่งั้น type จะเพี้ยนจาก DB จริง

export type ItemStatus = "available" | "rented" | "maintenance" | "inactive";

export type RentalOrderStatus =
  | "requested"
  | "awaiting_payment"
  | "paid"
  | "item_sent"
  | "item_returned"
  | "awaiting_additional_payment"
  | "completed"
  | "rejected"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type EvidenceType =
  | "renter_before"
  | "renter_after"
  | "lender_before"
  | "lender_after";

export interface Item {
  item_id: string;
  user_id: string;
  category_id: string | null;
  item_name: string;
  description: string | null;
  original_price: number | null;
  rental_fee_per_day: number | null;
  deposit: number | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  image_id: string;
  item_id: string;
  is_primary: boolean;
  sequence: number | null;
  image_url: string;
}

export interface ItemLocation {
  location_id: string;
  item_id: string;
  description: string | null;
  no: string | null;
  alley: string | null;
  road: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
}

export interface ItemCondition {
  item_id: string;
  seq: number;
  condition: string;
}

export interface ItemWithDetails extends Item {
  images: ItemImage[];
  locations: ItemLocation[];
  conditions: ItemCondition[];
  category_name?: string | null;
}

export interface RentalOrder {
  order_id: string;
  user_id: string; // ผู้เช่า
  item_id: string;
  meetup_location: string | null;
  return_location: string | null;
  start_date: string;
  end_date: string;
  return_at: string | null;
  rental_fee: number | null;
  deposit: number | null;
  total_paid: number | null;
  fee: number | null;
  net_income: number | null;
  status: RentalOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  payment_id: string;
  order_id: string;
  user_id: string;
  amount: number | null;
  date: string;
  slip_image_url: string | null;
  transaction_ref: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}
