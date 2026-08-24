import type { ItemCategoryRow, Product } from "@/lib/types/product";

export type CatalogSort =
  | "rating-desc"
  | "newest"
  | "price-asc"
  | "price-desc";

export type ProductFilterState = {
  selectedCategoryIds: string[];
  minPrice: string;
  maxPrice: string;
  ratingBand: number;
  startDate: string;
  endDate: string;
  onlyAvailable: boolean;
};

export type ProductFilterCriteria = {
  minPrice: number | null;
  maxPrice: number | null;
  ratingBand: number;
  startDate: string;
  endDate: string;
  onlyAvailable: boolean;
  hasInvalidRange: boolean;
};

export type ProductCategoryOption = {
  id: string;
  name: string;
  count: number;
};

export function createInitialProductFilters(): ProductFilterState {
  return {
    selectedCategoryIds: [],
    minPrice: "",
    maxPrice: "",
    ratingBand: 0,
    startDate: "",
    endDate: "",
    onlyAvailable: true,
  };
}

export function createFilterCriteria(filters: ProductFilterState) {
  // ค่าในช่องราคาเก็บเป็น string เพื่อให้ input ว่างได้ ก่อนแปลงเป็นตัวเลขสำหรับกรองสินค้า
  const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);

  // ตรวจช่วงที่ผู้ใช้กรอกผิด เพื่อแสดงข้อความเตือนและไม่คืนสินค้าระหว่างที่ช่วงยังไม่ถูกต้อง
  const invalidPriceRange =
    minPrice !== null && maxPrice !== null && minPrice > maxPrice;
  const invalidDateRange = Boolean(
    filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate,
  );
  const hasCompleteDateRange = Boolean(filters.startDate && filters.endDate);

  const criteria: ProductFilterCriteria = {
    minPrice,
    maxPrice,
    ratingBand: filters.ratingBand,
    // เริ่มกรองวันเมื่อเลือกครบทั้งวันเริ่มและวันคืนแล้วเท่านั้น
    startDate: hasCompleteDateRange ? filters.startDate : "",
    endDate: hasCompleteDateRange ? filters.endDate : "",
    onlyAvailable: filters.onlyAvailable,
    hasInvalidRange: invalidPriceRange || invalidDateRange,
  };

  return { criteria, invalidPriceRange, invalidDateRange };
}

export function matchesNonCategoryFilters(
  product: Product,
  criteria: ProductFilterCriteria,
) {
  if (criteria.hasInvalidRange) return false;

  const matchesMinPrice =
    criteria.minPrice === null || product.pricePerDay >= criteria.minPrice;
  const matchesMaxPrice =
    criteria.maxPrice === null || product.pricePerDay <= criteria.maxPrice;
  // 0 หมายถึงทุกคะแนน ส่วน 1-5 หมายถึงช่วงคะแนนของเลขนั้น
  // เช่น ratingBand 2 จะแสดงเฉพาะ 2.0 ถึง 2.9 (ไม่รวม 3.0)
  const matchesRating =
    criteria.ratingBand === 0 ||
    (product.rating >= criteria.ratingBand &&
      product.rating < criteria.ratingBand + 1);
  const matchesStatus =
    !criteria.onlyAvailable || product.status === "available";

  // วันเริ่มและวันคืนต้องอยู่ภายใน availability ช่วงเดียวกัน โดยรวมวันขอบเขตทั้งสองวัน
  const matchesDate =
    (!criteria.startDate && !criteria.endDate) ||
    product.availability.some(
      (range) =>
        range.startDate <= criteria.startDate &&
        range.endDate >= criteria.endDate,
    );

  return (
    matchesMinPrice &&
    matchesMaxPrice &&
    matchesRating &&
    matchesStatus &&
    matchesDate
  );
}

export function buildCategoryOptions(
  itemCategories: ItemCategoryRow[],
  products: Product[],
  criteria: ProductFilterCriteria,
): ProductCategoryOption[] {
  const categoryMap = new Map<string, ProductCategoryOption>();

  // เริ่มจากหมวดหมู่ทั้งหมด เพื่อให้หมวดที่ยังไม่มีสินค้ายังคงแสดงด้วย count 0
  itemCategories.forEach((category) => {
    categoryMap.set(String(category.category_id), {
      id: String(category.category_id),
      name: category.category_name,
      count: 0,
    });
  });

  // count คำนวณจากตัวกรองอื่น แต่ไม่รวมหมวดหมู่ เพื่อให้ผู้ใช้เห็นจำนวนก่อนเลือกหมวด
  products.forEach((product) => {
    const current = categoryMap.get(product.categoryId);
    categoryMap.set(product.categoryId, {
      id: product.categoryId,
      name: current?.name ?? product.categoryName,
      count:
        (current?.count ?? 0) +
        Number(matchesNonCategoryFilters(product, criteria)),
    });
  });

  return Array.from(categoryMap.values()).sort((a, b) => {
    // วางหมวด "อื่นๆ" ไว้ท้ายรายการเสมอ ส่วนหมวดที่เหลือเรียงตามภาษาไทย
    if (a.name === "อื่นๆ") return 1;
    if (b.name === "อื่นๆ") return -1;
    return a.name.localeCompare(b.name, "th");
  });
}

export function filterProducts(
  products: Product[],
  selectedCategoryIds: string[],
  criteria: ProductFilterCriteria,
) {
  return products.filter((product) => {
    // ถ้ายังไม่เลือกหมวด ให้ผ่านทุกหมวด; ถ้าเลือกแล้ว สินค้าต้องอยู่ในหมวดที่เลือก
    const matchesCategory =
      selectedCategoryIds.length === 0 ||
      selectedCategoryIds.includes(product.categoryId);

    return matchesCategory && matchesNonCategoryFilters(product, criteria);
  });
}

export function sortProducts(products: Product[], sortBy: CatalogSort) {
  // sort แก้ array ต้นฉบับ จึง copy ก่อนเพื่อไม่ให้ข้อมูลจาก props ถูกเปลี่ยน
  return [...products].sort((a, b) => {
    if (sortBy === "newest") {
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (sortBy === "price-asc") {
      return a.pricePerDay - b.pricePerDay;
    }
    if (sortBy === "price-desc") {
      return b.pricePerDay - a.pricePerDay;
    }

    // ค่าเริ่มต้นเรียงคะแนนสูงไปต่ำ และใช้จำนวนรีวิวเป็นตัวตัดสินเมื่อคะแนนเท่ากัน
    return b.rating - a.rating || b.reviewCount - a.reviewCount;
  });
}
