"use client";

import { useMemo, useState } from "react";
import { Grid2X2, List, RotateCcw, SlidersHorizontal } from "lucide-react";

import type { ItemCategoryRow, Product } from "@/lib/types/product";
import ProductCard from "./ProductCard";

type ProductCatalogProps = {
  itemCategories: ItemCategoryRow[];
  products: Product[];
};

type ProductFilterCriteria = {
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number;
  startDate: string;
  endDate: string;
  onlyAvailable: boolean;
  hasInvalidRange: boolean;
};

type CatalogLayout = "grid" | "list";
type CatalogSort = "rating-desc" | "newest" | "price-asc" | "price-desc";

function matchesNonCategoryFilters(
  product: Product,
  criteria: ProductFilterCriteria,
) {
  if (criteria.hasInvalidRange) return false;

  const matchesMinPrice =
    criteria.minPrice === null || product.pricePerDay >= criteria.minPrice;
  const matchesMaxPrice =
    criteria.maxPrice === null || product.pricePerDay <= criteria.maxPrice;
  const matchesRating = product.rating >= criteria.minRating;
  const matchesStatus =
    !criteria.onlyAvailable || product.status === "available";
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
    matchesMinPrice &&
    matchesMaxPrice &&
    matchesRating &&
    matchesStatus &&
    matchesDate
  );
}

export default function ProductCatalog({
  itemCategories,
  products,
}: ProductCatalogProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [layout, setLayout] = useState<CatalogLayout>("grid");
  const [sortBy, setSortBy] = useState<CatalogSort>("rating-desc");

  const minPriceValue = minPrice === "" ? null : Number(minPrice);
  const maxPriceValue = maxPrice === "" ? null : Number(maxPrice);
  const invalidPriceRange =
    minPriceValue !== null &&
    maxPriceValue !== null &&
    minPriceValue > maxPriceValue;
  const invalidDateRange = Boolean(startDate && endDate && startDate > endDate);

  const filterCriteria = useMemo<ProductFilterCriteria>(
    () => ({
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      minRating,
      startDate,
      endDate,
      onlyAvailable,
      hasInvalidRange: invalidPriceRange || invalidDateRange,
    }),
    [
      endDate,
      invalidDateRange,
      invalidPriceRange,
      maxPriceValue,
      minPriceValue,
      minRating,
      onlyAvailable,
      startDate,
    ],
  );

  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; count: number }>();

    itemCategories.forEach((category) => {
      categoryMap.set(String(category.category_id), {
        id: String(category.category_id),
        name: category.category_name,
        count: 0,
      });
    });

    products.forEach((product) => {
      const current = categoryMap.get(product.categoryId);
      categoryMap.set(product.categoryId, {
        id: product.categoryId,
        name: current?.name ?? product.categoryName,
        count:
          (current?.count ?? 0) +
          Number(matchesNonCategoryFilters(product, filterCriteria)),
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => {
      if (a.name === "อื่นๆ") return 1;
      if (b.name === "อื่นๆ") return -1;
      return a.name.localeCompare(b.name, "th");
    });
  }, [filterCriteria, itemCategories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.includes(product.categoryId);

      return matchesCategory && matchesNonCategoryFilters(product, filterCriteria);
    });
  }, [filterCriteria, products, selectedCategoryIds]);

  const sortedProducts = useMemo(() => {
    // ใช้ข้อมูลจากที่ Fliter สร้าง Array ใหม่
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      // ต่ำไปสูง ติดลบ a ขึ้นก่อน
      if (sortBy === "price-asc") {
        return a.pricePerDay - b.pricePerDay;
      }
      // สูงไปต่ำ เป็นบวก b ขึ้นก่อน
      if (sortBy === "price-desc") {
        return b.pricePerDay - a.pricePerDay;
      }

      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    });
  }, [filteredProducts, sortBy]);

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  function resetFilters() {
    setSelectedCategoryIds([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setStartDate("");
    setEndDate("");
    setOnlyAvailable(true);
  }

  const sidebar = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#1b3554]">ตัวกรอง</h2>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-sky-700"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          ล้าง
        </button>
      </div>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">หมวดหมู่</legend>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"
            >
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="h-4 w-4 rounded border-slate-300 accent-sky-600"
              />
              <span className="min-w-0 flex-1">{category.name}</span>
              <span className="text-xs text-slate-400">{category.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">
          ค่าเช่าต่อวัน
        </legend>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <label>
            <span className="sr-only">ค่าเช่าต่ำสุด</span>
            <input
              type="number"
              min="0"
              step="50"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="ต่ำสุด"
              className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <span className="text-slate-400">–</span>
          <label>
            <span className="sr-only">ค่าเช่าสูงสุด</span>
            <input
              type="number"
              min="0"
              step="50"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="สูงสุด"
              className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>
        {invalidPriceRange && (
          <p className="mt-2 text-xs text-rose-600">ราคาต่ำสุดต้องไม่เกินราคาสูงสุด</p>
        )}
      </fieldset>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">คะแนนรีวิว</legend>
        <select
          value={minRating}
          onChange={(event) => setMinRating(Number(event.target.value))}
          aria-label="คะแนนรีวิวขั้นต่ำ"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
        >
          <option value={0}>ทุกคะแนน</option>
          <option value={4.5}>4.5 ดาวขึ้นไป</option>
          <option value={4}>4 ดาวขึ้นไป</option>
          <option value={3}>3 ดาวขึ้นไป</option>
        </select>
      </fieldset>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">
          วันที่ต้องการเช่า
        </legend>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">วันที่เริ่มเช่า</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">วันที่คืน</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>
        {invalidDateRange && (
          <p className="mt-2 text-xs text-rose-600">วันที่คืนต้องไม่อยู่ก่อนวันที่เริ่มเช่า</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          สินค้าต้องว่างครบตลอดช่วงวันที่เลือก
        </p>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-3">
        <input
          type="checkbox"
          checked={onlyAvailable}
          onChange={(event) => setOnlyAvailable(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-sky-600"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-800">
            พร้อมให้เช่าเท่านั้น
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">
            ซ่อนสินค้าที่ถูกเช่า ซ่อมบำรุง หรือปิดประกาศ
          </span>
        </span>
      </label>
    </div>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setFiltersOpen((current) => !current)}
        aria-expanded={filtersOpen}
        aria-controls="product-filters"
        className="mb-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-[#1b3554] lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        ตัวกรอง
      </button>

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-7">
        <aside
          id="product-filters"
          className={`${filtersOpen ? "block" : "hidden"} rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block`}
        >
          {sidebar}
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 px-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-0">
            <p className="text-sm text-slate-500" aria-live="polite">
              พบ <span className="font-semibold text-slate-800">{filteredProducts.length}</span>{" "}
              รายการ
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <span className="whitespace-nowrap">เรียงตาม:</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as CatalogSort)}
                  aria-label="เรียงลำดับสินค้า"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="rating-desc">คะแนนสูงสุด</option>
                  <option value="newest">ใหม่ล่าสุด</option>
                  <option value="price-asc">ราคาต่ำสุด</option>
                  <option value="price-desc">ราคาสูงสุด</option>
                </select>
              </label>

              <div
                className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
                role="group"
                aria-label="รูปแบบการแสดงสินค้า"
              >
                <button
                  type="button"
                  onClick={() => setLayout("grid")}
                  aria-label="แสดงแบบตาราง"
                  aria-pressed={layout === "grid"}
                  title="แสดงแบบตาราง"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    layout === "grid"
                      ? "bg-slate-100 text-[#1b3554]"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <Grid2X2 aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayout("list")}
                  aria-label="แสดงแบบรายการ"
                  aria-pressed={layout === "list"}
                  title="แสดงแบบรายการ"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    layout === "list"
                      ? "bg-slate-100 text-[#1b3554]"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <List aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {sortedProducts.length > 0 ? (
            <div
              className={
                layout === "grid"
                  ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6"
                  : "grid gap-4"
              }
            >
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} listing={product} layout={layout} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-16 text-center">
              <p className="font-semibold text-slate-700">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
              <p className="mt-1 text-sm text-slate-400">
                ลองเปลี่ยนหมวดหมู่ ราคา คะแนน หรือช่วงวันที่
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-[#1b3554] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#000f22]"
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
