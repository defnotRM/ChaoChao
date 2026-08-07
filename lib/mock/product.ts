import type {
  AvailabilityRow,
  ItemCategoryRow,
  ItemImageRow,
  ItemLocationRow,
  ItemRatingSummary,
  ItemRow,
  Product,
} from "@/lib/types/product";

// Mock table: ItemCategory
export const mockItemCategories: ItemCategoryRow[] = [
  { category_id: 1, category_name: "กล้องและอุปกรณ์ถ่ายภาพ" },
  { category_id: 2, category_name: "เครื่องเสียง" },
  { category_id: 3, category_name: "แคมป์ปิ้ง" },
  { category_id: 4, category_name: "เครื่องมือช่าง" },
  { category_id: 5, category_name: "อุปกรณ์ไลฟ์และสตูดิโอ" },
  { category_id: 6, category_name: "เดินทาง" },
  { category_id: 7, category_name: "กีฬา" },
];

// Mock table: Item
export const mockItems: ItemRow[] = [
  {
    item_id: 1,
    user_id: 101,
    category_id: 1,
    item_name: "กล้อง Sony A7 III พร้อมเลนส์ 24-70mm",
    description: "กล้อง Mirrorless Full-frame 24.2MP พร้อมเลนส์ 24-70mm เหมาะสำหรับถ่ายภาพ งานแต่ง และวิดีโอ",
    original_price: 72000,
    rental_fee_per_day: 900,
    deposit: 5000,
    status: "available",
    create_at: "2026-07-01T09:00:00+07:00",
  },
  {
    item_id: 2,
    user_id: 102,
    category_id: 2,
    item_name: "ลำโพง JBL PartyBox 310",
    description: "ลำโพง Bluetooth กำลังสูง มีไฟเอฟเฟกต์ เหมาะสำหรับงานเลี้ยงและกิจกรรมกลางแจ้ง",
    original_price: 18900,
    rental_fee_per_day: 600,
    deposit: 2500,
    status: "available",
    create_at: "2026-07-03T10:30:00+07:00",
  },
  {
    item_id: 3,
    user_id: 103,
    category_id: 3,
    item_name: "เต็นท์ Coleman สำหรับ 4 คน",
    description: "เต็นท์ขนาด 4 คน กันน้ำ พร้อมผ้าคลุมและสมอบก เหมาะสำหรับเดินป่าและตั้งแคมป์",
    original_price: 8500,
    rental_fee_per_day: 350,
    deposit: 1200,
    status: "rented",
    create_at: "2026-07-05T14:00:00+07:00",
  },
  {
    item_id: 4,
    user_id: 104,
    category_id: 4,
    item_name: "สว่านไร้สาย Makita 18V",
    description: "สว่านไร้สายพร้อมแบตเตอรี่ 2 ก้อนและชุดดอกสว่าน สำหรับงานไม้ เหล็ก และงานติดตั้ง",
    original_price: 7900,
    rental_fee_per_day: 250,
    deposit: 1500,
    status: "available",
    create_at: "2026-07-08T08:45:00+07:00",
  },
  {
    item_id: 5,
    user_id: 105,
    category_id: 1,
    item_name: "GoPro HERO 12 Black",
    description: "กล้อง Action Camera ถ่ายวิดีโอ 5.3K พร้อมเคสกันน้ำและอุปกรณ์ยึดสำหรับกิจกรรมกลางแจ้ง",
    original_price: 15900,
    rental_fee_per_day: 450,
    deposit: 2000,
    status: "available",
    create_at: "2026-07-10T11:15:00+07:00",
  },
  {
    item_id: 6,
    user_id: 101,
    category_id: 5,
    item_name: "ชุดไฟสตูดิโอ LED พร้อมขาตั้ง",
    description: "ชุดไฟ LED 2 ดวง ปรับความสว่างและอุณหภูมิสีได้ พร้อมขาตั้งและกระเป๋า",
    original_price: 12500,
    rental_fee_per_day: 500,
    deposit: 1800,
    status: "maintenance",
    create_at: "2026-07-12T13:20:00+07:00",
  },
  {
    item_id: 7,
    user_id: 106,
    category_id: 6,
    item_name: "กระเป๋าเดินทาง Samsonite 28 นิ้ว",
    description: "กระเป๋าเดินทางขนาด 28 นิ้ว ระบบล็อก TSA และล้อหมุน 360 องศา",
    original_price: 9800,
    rental_fee_per_day: 180,
    deposit: 1000,
    status: "available",
    create_at: "2026-07-15T16:00:00+07:00",
  },
  {
    item_id: 8,
    user_id: 107,
    category_id: 7,
    item_name: "จักรยานเสือภูเขา Trek Marlin 7",
    description: "จักรยานเฟรมอะลูมิเนียม เกียร์ Shimano พร้อมหมวกกันน็อกและกุญแจล็อก",
    original_price: 28500,
    rental_fee_per_day: 400,
    deposit: 3000,
    status: "inactive",
    create_at: "2026-07-18T09:40:00+07:00",
  },
];

const storageBaseUrl =
  "https://example.supabase.co/storage/v1/object/public/item-images";

// Mock table: ItemImage
export const mockItemImages: ItemImageRow[] = mockItems.flatMap((item) => [
  {
    image_id: item.item_id * 10 + 1,
    item_id: item.item_id,
    is_primary: true,
    sequence: 1,
    image_url: `${storageBaseUrl}/${item.item_id}/cover.jpg`,
    create_at: item.create_at,
  },
  {
    image_id: item.item_id * 10 + 2,
    item_id: item.item_id,
    is_primary: false,
    sequence: 2,
    image_url: `${storageBaseUrl}/${item.item_id}/detail.jpg`,
    create_at: item.create_at,
  },
]);

// Mock table: ItemLocation
export const mockItemLocations: ItemLocationRow[] = [
  { location_id: 1, item_id: 1, description: "BTS พญาไท", no: "-", alley: null, road: "พญาไท", subdistrict: "ถนนพญาไท", district: "ราชเทวี", province: "กรุงเทพฯ" },
  { location_id: 2, item_id: 1, description: "APL ลาดกระบัง", no: "-", alley: null, road: "ร่มเกล้า", subdistrict: "ลาดกระบัง", district: "ลาดกระบัง", province: "กรุงเทพฯ" },
  { location_id: 3, item_id: 1, description: "IMPACT เมืองทองธานี", no: "99", alley: null, road: "ป๊อปปูล่า", subdistrict: "บ้านใหม่", district: "ปากเกร็ด", province: "นนทบุรี" },
  { location_id: 4, item_id: 2, description: "Central บางนา", no: "585", alley: null, road: "เทพรัตน", subdistrict: "บางนาเหนือ", district: "บางนา", province: "กรุงเทพฯ" },
  { location_id: 5, item_id: 2, description: "BTS อุดมสุข", no: "-", alley: null, road: "สุขุมวิท", subdistrict: "บางนาเหนือ", district: "บางนา", province: "กรุงเทพฯ" },
  { location_id: 6, item_id: 3, description: "Future Park รังสิต", no: "94", alley: null, road: "พหลโยธิน", subdistrict: "ประชาธิปัตย์", district: "ธัญบุรี", province: "ปทุมธานี" },
  { location_id: 7, item_id: 4, description: "BTS พระโขนง", no: "-", alley: null, road: "สุขุมวิท", subdistrict: "พระโขนง", district: "คลองเตย", province: "กรุงเทพฯ" },
  { location_id: 8, item_id: 5, description: "MRT ห้วยขวาง", no: "-", alley: null, road: "รัชดาภิเษก", subdistrict: "ห้วยขวาง", district: "ห้วยขวาง", province: "กรุงเทพฯ" },
  { location_id: 9, item_id: 6, description: "Central ลาดพร้าว", no: "1693", alley: null, road: "พหลโยธิน", subdistrict: "จตุจักร", district: "จตุจักร", province: "กรุงเทพฯ" },
  { location_id: 10, item_id: 7, description: "สนามบินดอนเมือง", no: "222", alley: null, road: "วิภาวดีรังสิต", subdistrict: "สนามบิน", district: "ดอนเมือง", province: "กรุงเทพฯ" },
  { location_id: 11, item_id: 8, description: "สวนหลวง ร.9", no: "-", alley: null, road: "เฉลิมพระเกียรติ ร.9", subdistrict: "หนองบอน", district: "ประเวศ", province: "กรุงเทพฯ" },
];

// Mock table: Availability
// วันที่เป็นช่วงแบบ inclusive: ผู้เช่าสามารถเลือกได้ตั้งแต่ start_date ถึง end_date
// สินค้าหนึ่งชิ้นมีหลายช่วงได้ เพื่อเว้นวันที่ถูกจองหรือวันที่ผู้ให้เช่าไม่สะดวก
export const mockAvailabilities: AvailabilityRow[] = [
  { availability_id: 1, item_id: 1, start_date: "2026-08-10", end_date: "2026-09-30" },
  { availability_id: 2, item_id: 1, start_date: "2026-10-05", end_date: "2026-12-31" },
  { availability_id: 3, item_id: 2, start_date: "2026-08-08", end_date: "2026-08-31" },
  { availability_id: 4, item_id: 2, start_date: "2026-09-10", end_date: "2026-10-31" },
  { availability_id: 5, item_id: 2, start_date: "2026-11-15", end_date: "2026-12-31" },
  { availability_id: 6, item_id: 3, start_date: "2026-08-18", end_date: "2026-09-15" },
  { availability_id: 7, item_id: 3, start_date: "2026-10-01", end_date: "2026-11-30" },
  { availability_id: 8, item_id: 4, start_date: "2026-08-06", end_date: "2026-08-25" },
  { availability_id: 9, item_id: 4, start_date: "2026-09-01", end_date: "2026-10-15" },
  { availability_id: 10, item_id: 4, start_date: "2026-11-01", end_date: "2026-12-31" },
  { availability_id: 11, item_id: 5, start_date: "2026-08-09", end_date: "2026-08-20" },
  { availability_id: 12, item_id: 5, start_date: "2026-09-05", end_date: "2026-10-31" },
  { availability_id: 13, item_id: 5, start_date: "2026-11-10", end_date: "2026-12-31" },
  { availability_id: 14, item_id: 6, start_date: "2026-08-20", end_date: "2026-09-30" },
  { availability_id: 15, item_id: 6, start_date: "2026-10-15", end_date: "2026-11-30" },
  { availability_id: 16, item_id: 7, start_date: "2026-08-07", end_date: "2026-09-15" },
  { availability_id: 17, item_id: 7, start_date: "2026-10-01", end_date: "2026-12-31" },
];

// Mock ของผล aggregate รีวิวสำหรับ ProductCard (ไม่ใช่ database table)
export const mockItemRatingSummaries: ItemRatingSummary[] = [
  { item_id: 1, rating: 4.9, review_count: 36 },
  { item_id: 2, rating: 4.7, review_count: 21 },
  { item_id: 3, rating: 4.6, review_count: 18 },
  { item_id: 4, rating: 4.8, review_count: 42 },
  { item_id: 5, rating: 4.9, review_count: 54 },
  { item_id: 6, rating: 4.5, review_count: 12 },
  { item_id: 7, rating: 4.4, review_count: 15 },
  { item_id: 8, rating: 4.8, review_count: 29 },
];

function formatFullAddress(location: ItemLocationRow) {
  return [
    location.no === "-" ? null : location.no,
    location.alley,
    location.road,
    location.subdistrict,
    location.district,
    location.province,
  ]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

function mapItemToProduct(item: ItemRow): Product {
  const category = mockItemCategories.find(
    (entry) => entry.category_id === item.category_id,
  );
  const images = mockItemImages
    .filter((image) => image.item_id === item.item_id)
    .sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || a.sequence - b.sequence,
    );
  const locations = mockItemLocations.filter(
    (location) => location.item_id === item.item_id,
  );
  const availability = mockAvailabilities
    .filter((entry) => entry.item_id === item.item_id)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const rating = mockItemRatingSummaries.find(
    (entry) => entry.item_id === item.item_id,
  );

  return {
    id: String(item.item_id),
    title: item.item_name,
    categoryId: String(item.category_id),
    categoryName: category?.category_name ?? "ไม่ระบุหมวดหมู่",
    imageUrls: images.map((image) => image.image_url),
    description: item.description,
    originalPrice: item.original_price,
    pricePerDay: item.rental_fee_per_day,
    deposit: item.deposit,
    rating: rating?.rating ?? 0,
    reviewCount: rating?.review_count ?? 0,
    locations: locations.map((location) => ({
      id: String(location.location_id),
      description: location.description,
      no: location.no,
      alley: location.alley,
      road: location.road,
      subdistrict: location.subdistrict,
      district: location.district,
      province: location.province,
      fullAddress: formatFullAddress(location),
    })),
    ownerId: String(item.user_id),
    status: item.status,
    availability: availability.map((entry) => ({
      startDate: entry.start_date,
      endDate: entry.end_date,
    })),
    createdAt: item.create_at,
  };
}

// UI mock ที่รักษาลำดับตาม mockItems เหมือน SELECT ... ORDER BY item_id
export const mockProducts: Product[] = mockItems.map(mapItemToProduct);

export function getMockProducts(): Product[] {
  return mockProducts;
}

export function getMockProductById(id: string): Product | undefined {
  return mockProducts.find((product) => product.id === id);
}
