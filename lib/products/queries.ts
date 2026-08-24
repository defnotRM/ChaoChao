import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ItemCategoryRow,
  ItemStatus,
  Product,
  ProductLocation,
  ProductReview,
} from "@/lib/types/product";

/**
 * Server-side data layer แปลงข้อมูล Supabase → UI model `Product` เดิม
 * ใช้ admin client (service role) เลี่ยง RLS ให้เห็นทั้ง available/rented
 * แพทเทิร์นเดียวกับ app/renter/hireproduct/[id]/booking/page.tsx
 */

const VALID_STATUSES: ItemStatus[] = [
  "available",
  "rented",
  "maintenance",
  "inactive",
];

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(status: unknown): ItemStatus {
  return VALID_STATUSES.includes(status as ItemStatus)
    ? (status as ItemStatus)
    : "inactive";
}

// รวมที่อยู่ย่อยเป็นบรรทัดเดียว (คัดจาก lib/mock/product.ts:256)
function formatFullAddress(location: {
  no: string | null;
  alley: string | null;
  road: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
}) {
  return [
    location.no === "-" ? null : location.no,
    location.alley,
    location.road,
    location.subdistrict,
    location.district,
    location.province,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ");
}

type ImageRow = { item_id: string; image_url: string; is_primary: boolean; sequence: number | null };

// เรียงรูป: primary ก่อน แล้วตาม sequence
function sortImages(a: ImageRow, b: ImageRow) {
  if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
  return (a.sequence ?? 0) - (b.sequence ?? 0);
}

type LocationRow = {
  location_id: string;
  item_id: string;
  description: string | null;
  no: string | null;
  alley: string | null;
  road: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
};

function mapLocation(loc: LocationRow): ProductLocation {
  return {
    id: loc.location_id,
    description: loc.description || "จุดนัดรับ",
    no: loc.no || "",
    alley: loc.alley,
    road: loc.road,
    subdistrict: loc.subdistrict || "",
    district: loc.district || "",
    province: loc.province || "",
    fullAddress: formatFullAddress(loc),
  };
}

/** หมวดหมู่ทั้งหมด (ใช้ในตัวกรอง catalog) */
export async function getCategories(): Promise<ItemCategoryRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("itemcategory")
    .select("category_id, category_name")
    .order("category_name", { ascending: true });

  return (data || []).map((c) => ({
    category_id: c.category_id as unknown as number, // UI ใช้เป็น string อยู่แล้ว
    category_name: c.category_name,
  })) as unknown as ItemCategoryRow[];
}

/** รายการสินค้าสำหรับหน้า catalog (map เฉพาะฟิลด์ที่การ์ด/ตัวกรองใช้) */
export async function getProducts(): Promise<Product[]> {
  const admin = createAdminClient();

  const { data: items } = await admin
    .from("item")
    .select(
      "item_id, user_id, category_id, item_name, description, original_price, rental_fee_per_day, deposit, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (!items || items.length === 0) return [];

  const ids = items.map((it) => it.item_id);

  const [catRes, imgRes, locRes, availRes, reviewRes] = await Promise.all([
    admin.from("itemcategory").select("category_id, category_name"),
    admin
      .from("itemimage")
      .select("item_id, image_url, is_primary, sequence")
      .in("item_id", ids),
    admin
      .from("itemlocation")
      .select("location_id, item_id, description, no, alley, road, subdistrict, district, province")
      .in("item_id", ids),
    admin
      .from("availability")
      .select("item_id, start_date, end_date")
      .in("item_id", ids)
      .order("start_date", { ascending: true }),
    admin
      .from("review")
      .select("rating, order:order_id!inner ( item_id )"),
  ]);

  const categoryMap = new Map<string, string>(
    (catRes.data || []).map((c) => [c.category_id, c.category_name])
  );

  // จัดกลุ่มรูปต่อชิ้นแล้วเรียง (primary ก่อน, ตาม sequence)
  const imgSorted = new Map<string, string[]>();
  {
    const grouped = new Map<string, ImageRow[]>();
    for (const img of (imgRes.data || []) as ImageRow[]) {
      const list = grouped.get(img.item_id) || [];
      list.push(img);
      grouped.set(img.item_id, list);
    }
    for (const [itemId, rows] of grouped) {
      imgSorted.set(itemId, [...rows].sort(sortImages).map((r) => r.image_url));
    }
  }

  const locationsByItem = new Map<string, ProductLocation[]>();
  for (const loc of (locRes.data || []) as LocationRow[]) {
    const list = locationsByItem.get(loc.item_id) || [];
    list.push(mapLocation(loc));
    locationsByItem.set(loc.item_id, list);
  }

  const availByItem = new Map<string, Array<{ startDate: string; endDate: string }>>();
  for (const a of availRes.data || []) {
    const list = availByItem.get(a.item_id) || [];
    list.push({ startDate: a.start_date, endDate: a.end_date });
    availByItem.set(a.item_id, list);
  }

  // aggregate rating ต่อชิ้นจาก review (join ผ่าน rentalorder.item_id)
  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const r of (reviewRes.data || []) as unknown as Array<{ rating: number; order: { item_id: string } | null }>) {
    const itemId = r.order?.item_id;
    if (!itemId) continue;
    const cur = ratingAgg.get(itemId) || { sum: 0, count: 0 };
    cur.sum += toNumber(r.rating);
    cur.count += 1;
    ratingAgg.set(itemId, cur);
  }

  return items.map((it) => {
    const agg = ratingAgg.get(it.item_id);
    return {
      id: it.item_id,
      title: it.item_name,
      categoryId: it.category_id || "",
      categoryName: categoryMap.get(it.category_id) || "ไม่ระบุหมวดหมู่",
      imageUrls: imgSorted.get(it.item_id) || [],
      description: it.description || "",
      originalPrice: toNumber(it.original_price),
      pricePerDay: toNumber(it.rental_fee_per_day),
      deposit: toNumber(it.deposit),
      condition: "good", // ไม่มีคอลัมน์ condition ใน DB — ค่า default (ไม่ถูกแสดงผล)
      rating: agg ? agg.sum / agg.count : 0,
      reviewCount: agg ? agg.count : 0,
      locations: locationsByItem.get(it.item_id) || [],
      ownerId: it.user_id,
      owner: {
        id: it.user_id,
        displayName: "",
        rating: 0,
        reviewCount: 0,
        responseRate: 0,
        isVerified: false,
        joinedAt: it.created_at,
      },
      rentalTerms: [],
      reviews: [],
      status: normalizeStatus(it.status),
      availability: availByItem.get(it.item_id) || [],
      createdAt: it.created_at,
    } satisfies Product;
  });
}

/** รายละเอียดสินค้าชิ้นเดียว (ครบทุกฟิลด์สำหรับหน้า detail + widget) */
export async function getProductById(id: string): Promise<Product | null> {
  const admin = createAdminClient();

  const { data: it, error } = await admin
    .from("item")
    .select(
      "item_id, user_id, category_id, item_name, description, original_price, rental_fee_per_day, deposit, status, created_at"
    )
    .eq("item_id", id)
    .maybeSingle();

  if (error || !it) return null;

  const [catRes, imgRes, locRes, availRes, termsRes, ownerRes, reviewRes, ownerItemsRes] =
    await Promise.all([
      admin
        .from("itemcategory")
        .select("category_name")
        .eq("category_id", it.category_id)
        .maybeSingle(),
      admin
        .from("itemimage")
        .select("item_id, image_url, is_primary, sequence")
        .eq("item_id", id),
      admin
        .from("itemlocation")
        .select("location_id, item_id, description, no, alley, road, subdistrict, district, province")
        .eq("item_id", id),
      admin
        .from("availability")
        .select("item_id, start_date, end_date")
        .eq("item_id", id)
        .order("start_date", { ascending: true }),
      admin
        .from("itemcondition")
        .select("seq, condition")
        .eq("item_id", id)
        .order("seq", { ascending: true }),
      admin
        .from("useraccount")
        .select("user_id, firstname, lastname, username, avatar_url, updated_at, status, created_at")
        .eq("user_id", it.user_id)
        .maybeSingle(),
      // รีวิวของชิ้นนี้ + ชื่อผู้รีวิว (renter ผ่าน rentalorder.user_id)
      admin
        .from("review")
        .select(
          "rating, comment, created_at, order:order_id!inner ( item_id, renter:user_id ( firstname, lastname, username ) )"
        )
        .eq("order.item_id", id)
        .order("created_at", { ascending: false }),
      // item ทั้งหมดของ owner (สำหรับ aggregate เรตติ้งผู้ให้เช่า)
      admin.from("item").select("item_id").eq("user_id", it.user_id),
    ]);

  const imgRows = (imgRes.data || []) as ImageRow[];
  const imageUrls = [...imgRows].sort(sortImages).map((r) => r.image_url);

  const locations = ((locRes.data || []) as LocationRow[]).map(mapLocation);

  const availability = (availRes.data || []).map((a) => ({
    startDate: a.start_date,
    endDate: a.end_date,
  }));

  const rentalTerms = (termsRes.data || [])
    .map((t) => t.condition)
    .filter((c): c is string => Boolean(c && c.trim()));

  const reviews: ProductReview[] = (
    (reviewRes.data || []) as unknown as Array<{
      rating: number;
      comment: string | null;
      created_at: string;
      order: { renter: { firstname: string | null; lastname: string | null; username: string | null } | null } | null;
    }>
  ).map((r, index) => {
    const renter = r.order?.renter;
    const reviewerName =
      [renter?.firstname, renter?.lastname].filter(Boolean).join(" ").trim() ||
      renter?.username ||
      "ผู้เช่า";
    return {
      id: `${id}-review-${index}`,
      reviewerName,
      rating: toNumber(r.rating),
      comment: r.comment || "",
      createdAt: r.created_at,
    };
  });

  // เรตติ้งของชิ้นนี้
  const itemReviewSum = reviews.reduce((sum, r) => sum + r.rating, 0);
  const itemRating = reviews.length > 0 ? itemReviewSum / reviews.length : 0;

  // เรตติ้งผู้ให้เช่า = เฉลี่ยรีวิวของทุก item ที่ owner ถือครอง
  const ownerItemIds = (ownerItemsRes.data || []).map((r) => r.item_id);
  let ownerRating = 0;
  let ownerReviewCount = 0;
  if (ownerItemIds.length > 0) {
    const { data: ownerReviews } = await admin
      .from("review")
      .select("rating, order:order_id!inner ( item_id )")
      .in("order.item_id", ownerItemIds);
    const rows = (ownerReviews || []) as Array<{ rating: number }>;
    ownerReviewCount = rows.length;
    ownerRating =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + toNumber(r.rating), 0) / rows.length
        : 0;
  }

  const owner = ownerRes.data;
  const ownerName =
    [owner?.firstname, owner?.lastname].filter(Boolean).join(" ").trim() ||
    owner?.username ||
    "ผู้ให้เช่า";

  const v = owner?.updated_at
    ? new Date(owner.updated_at).getTime()
    : Date.now();
  const avatarUrl = owner?.avatar_url
    ? `/api/avatar?id=${owner.user_id}&v=${v}`
    : null;

  return {
    id: it.item_id,
    title: it.item_name,
    categoryId: it.category_id || "",
    categoryName: catRes.data?.category_name || "ไม่ระบุหมวดหมู่",
    imageUrls,
    description: it.description || "",
    originalPrice: toNumber(it.original_price),
    pricePerDay: toNumber(it.rental_fee_per_day),
    deposit: toNumber(it.deposit),
    condition: "good", // ไม่มีใน DB — ไม่ถูกแสดงผล
    rating: itemRating,
    reviewCount: reviews.length,
    locations,
    ownerId: it.user_id,
    owner: {
      id: it.user_id,
      displayName: ownerName,
      avatarUrl,
      rating: ownerRating,
      reviewCount: ownerReviewCount,
      responseRate: 0, // ไม่มีใน DB
      isVerified: owner?.status === "Active",
      joinedAt: owner?.created_at ?? it.created_at,
    },
    rentalTerms,
    reviews,
    status: normalizeStatus(it.status),
    availability,
    createdAt: it.created_at,
  } satisfies Product;
}
