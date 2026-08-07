"use client";

import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import type { Product } from "@/lib/types/product";
import ProductCard from "./ProductCard";

type ProductCatalogProps = {
  products: Product[];
};

export default function ProductCatalog({ products }: ProductCatalogProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; count: number }>();

    products.forEach((product) => {
      const current = categoryMap.get(product.categoryId);
      categoryMap.set(product.categoryId, {
        id: product.categoryId,
        name: product.categoryName,
        count: (current?.count ?? 0) + 1,
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "th"),
    );
  }, [products]);

  const minPriceValue = minPrice === "" ? null : Number(minPrice);
  const maxPriceValue = maxPrice === "" ? null : Number(maxPrice);
  const invalidPriceRange =
    minPriceValue !== null &&
    maxPriceValue !== null &&
    minPriceValue > maxPriceValue;
  const invalidDateRange = Boolean(startDate && endDate && startDate > endDate);

  const filteredProducts = useMemo(() => {
    if (invalidPriceRange || invalidDateRange) return [];

    return products.filter((product) => {
      const matchesCategory =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.includes(product.categoryId);
      const matchesMinPrice =
        minPriceValue === null || product.pricePerDay >= minPriceValue;
      const matchesMaxPrice =
        maxPriceValue === null || product.pricePerDay <= maxPriceValue;
      const matchesRating = product.rating >= minRating;
      const matchesStatus = !onlyAvailable || product.status === "available";
      const matchesDate =
        (!startDate && !endDate) ||
        product.availability.some((range) => {
          const containsStart =
            !startDate ||
            (range.startDate <= startDate && range.endDate >= startDate);
          const containsEnd =
            !endDate || (range.startDate <= endDate && range.endDate >= endDate);

          return containsStart && containsEnd;
        });

      return (
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRating &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    endDate,
    invalidDateRange,
    invalidPriceRange,
    maxPriceValue,
    minPriceValue,
    minRating,
    onlyAvailable,
    products,
    selectedCategoryIds,
    startDate,
  ]);

  const activeFilterCount =
    selectedCategoryIds.length +
    Number(minPrice !== "" || maxPrice !== "") +
    Number(minRating > 0) +
    Number(Boolean(startDate || endDate)) +
    Number(onlyAvailable);

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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#1b3554]">ตัวกรอง</h2>
          {activeFilterCount > 0 && (
            <span className="text-xs font-medium text-sky-600">
              {activeFilterCount}
            </span>
          )}
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

      <fieldset className="border-t border-slate-100 pt-4">
        <legend className="mb-3 text-sm font-semibold text-slate-800">หมวดหมู่</legend>
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

      <fieldset className="border-t border-slate-100 pt-4">
        <legend className="mb-3 text-sm font-semibold text-slate-800">
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

      <fieldset className="border-t border-slate-100 pt-4">
        <legend className="mb-3 text-sm font-semibold text-slate-800">คะแนนรีวิว</legend>
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

      <fieldset className="border-t border-slate-100 pt-4">
        <legend className="mb-3 text-sm font-semibold text-slate-800">
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

      <label className="flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-4">
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
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <aside
          id="product-filters"
          className={`${filtersOpen ? "block" : "hidden"} rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 lg:block lg:rounded-none lg:border-0 lg:border-r lg:border-slate-100 lg:bg-transparent lg:p-0 lg:pr-6`}
        >
          {sidebar}
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <p className="text-sm text-slate-500" aria-live="polite">
              พบ <span className="font-semibold text-slate-800">{filteredProducts.length}</span>{" "}
              รายการ
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} listing={product} />
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
