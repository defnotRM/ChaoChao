import type { ItemCategoryRow, Product } from "@/lib/types/product";

export type CatalogSort =
  | "rating-desc"
  | "newest"
  | "price-asc"
  | "price-desc";

export type ProductFilterState = {
  searchQuery: string;
  selectedCategoryIds: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  startDate: string;
  endDate: string;
  onlyAvailable: boolean;
};

export type ProductFilterCriteria = {
  searchQuery: string;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number;
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

export function createInitialProductFilters(initialSearch = ""): ProductFilterState {
  return {
    searchQuery: initialSearch,
    selectedCategoryIds: [],
    minPrice: "",
    maxPrice: "",
    minRating: 0,
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

  const criteria: ProductFilterCriteria = {
    searchQuery: (filters.searchQuery || "").trim().toLowerCase(),
    minPrice,
    maxPrice,
    minRating: filters.minRating,
    startDate: filters.startDate,
    endDate: filters.endDate,
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

  // ค้นหาตามคำค้นหา (ชื่อสินค้า, รายละเอียด, หมวดหมู่)
  const matchesSearch =
    !criteria.searchQuery ||
    (product.title && product.title.toLowerCase().includes(criteria.searchQuery)) ||
    (product.description && product.description.toLowerCase().includes(criteria.searchQuery)) ||
    (product.categoryName && product.categoryName.toLowerCase().includes(criteria.searchQuery));

  const matchesMinPrice =
    criteria.minPrice === null || product.pricePerDay >= criteria.minPrice;
  const matchesMaxPrice =
    criteria.maxPrice === null || product.pricePerDay <= criteria.maxPrice;
  const matchesRating = product.rating >= criteria.minRating;
  const matchesStatus =
    !criteria.onlyAvailable || product.status === "available";

  // สินค้าต้องมีช่วง availability อย่างน้อยหนึ่งช่วงที่ครอบคลุมวันเริ่มและวันคืนทั้งหมด
  const matchesDate =
    (!criteria.startDate && !criteria.endDate) ||
    product.availability.some((range) => {
      const containsStart =
        !criteria.startDate ||
        (range.startDate <= criteria.startDate &&
          range.endDate >= criteria.startDate);
      const containsEnd =
        !criteria.endDate ||
        (range.startDate <= criteria.endDate &&
          range.endDate >= criteria.endDate);

      return containsStart && containsEnd;
    });

  return (
    matchesSearch &&
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
