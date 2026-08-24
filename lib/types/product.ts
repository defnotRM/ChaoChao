export type ItemStatus = "available" | "rented" | "maintenance" | "inactive";
export type ItemCondition = "like-new" | "good" | "fair";

// Database rows used by the product/listing feature.
export interface ItemCategoryRow {
  category_id: number;
  category_name: string;
}

export interface ItemRow {
  item_id: number;
  user_id: number;
  category_id: number;
  item_name: string;
  description: string;
  original_price: number;
  rental_fee_per_day: number;
  deposit: number;
  condition: ItemCondition;
  status: ItemStatus;
  create_at: string;
}

export interface ItemImageRow {
  image_id: number;
  item_id: number;
  is_primary: boolean;
  sequence: number;
  image_url: string;
  create_at: string;
}

export interface ItemLocationRow {
  location_id: number;
  item_id: number;
  // ชื่อสั้นของจุดนัดรับ เช่น "BTS พญาไท" หรือ "APL ลาดกระบัง"
  description: string;
  // รายละเอียดที่อยู่ของจุดนัดรับนี้ แต่ละแถวสามารถมีค่าต่างกันได้
  no: string;
  alley: string | null;
  road: string | null;
  subdistrict: string;
  district: string;
  province: string;
}

export interface AvailabilityRow {
  availability_id: number;
  item_id: number;
  start_date: string;
  end_date: string;
}

// ค่านี้เป็นผลรวมที่หน้า Product ใช้ หลัง aggregate จาก Review + RentalOrder.
export interface ItemRatingSummary {
  item_id: number;
  rating: number;
  review_count: number;
}

export interface UserProfileRow {
  user_id: number;
  display_name: string;
  rating: number;
  review_count: number;
  response_rate: number;
  is_verified: boolean;
  joined_at: string;
}

export interface ItemRentalTermRow {
  term_id: number;
  item_id: number;
  description: string;
}

export interface ItemReviewRow {
  review_id: number;
  item_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  create_at: string;
}

export interface ProductLocation {
  id: string;
  description: string;
  no: string;
  alley: string | null;
  road: string | null;
  subdistrict: string;
  district: string;
  province: string;
  fullAddress: string;
}

export interface ProductOwner {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  rating: number;
  reviewCount: number;
  responseRate: number;
  isVerified: boolean;
  joinedAt: string;
}

export interface ProductReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// UI model ที่ได้จากการ join ตาราง Product ด้านบน ไม่ใช่ database table.
export interface Product {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  imageUrls: string[];
  description: string;
  originalPrice: number;
  pricePerDay: number;
  deposit: number;
  condition: ItemCondition;
  rating: number;
  reviewCount: number;
  locations: ProductLocation[];
  ownerId: string;
  owner: ProductOwner;
  rentalTerms: string[];
  reviews: ProductReview[];
  status: ItemStatus;
  availability: Array<{
    startDate: string;
    endDate: string;
  }>;
  createdAt: string;
}
