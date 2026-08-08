"use client";

import { useMemo, useState } from "react";
import { Grid2X2, List, SlidersHorizontal } from "lucide-react";

import type { ItemCategoryRow, Product } from "@/lib/types/product";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import {
  buildCategoryOptions,
  createFilterCriteria,
  createInitialProductFilters,
  filterProducts,
  sortProducts,
  type CatalogSort,
  type ProductFilterState,
} from "./productCatalogLogic";

type ProductCatalogProps = {
  itemCategories: ItemCategoryRow[];
  products: Product[];
};

type CatalogLayout = "grid" | "list";

export default function ProductCatalog({
  itemCategories,
  products,
}: ProductCatalogProps) {
  const [filters, setFilters] = useState(createInitialProductFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [layout, setLayout] = useState<CatalogLayout>("grid");
  const [sortBy, setSortBy] = useState<CatalogSort>("rating-desc");

  const { criteria, invalidPriceRange, invalidDateRange } = useMemo(
    () => createFilterCriteria(filters),
    [filters],
  );

  const categories = useMemo(
    () => buildCategoryOptions(itemCategories, products, criteria),
    [criteria, itemCategories, products],
  );

  const filteredProducts = useMemo(
    () => filterProducts(products, filters.selectedCategoryIds, criteria),
    [criteria, filters.selectedCategoryIds, products],
  );

  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortBy),
    [filteredProducts, sortBy],
  );

  function updateFilters(patch: Partial<ProductFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function toggleCategory(categoryId: string) {
    setFilters((current) => ({
      ...current,
      selectedCategoryIds: current.selectedCategoryIds.includes(categoryId)
        ? current.selectedCategoryIds.filter((id) => id !== categoryId)
        : [...current.selectedCategoryIds, categoryId],
    }));
  }

  function resetFilters() {
    setFilters(createInitialProductFilters());
  }

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
          <ProductFilters
            categories={categories}
            filters={filters}
            invalidPriceRange={invalidPriceRange}
            invalidDateRange={invalidDateRange}
            onChange={updateFilters}
            onToggleCategory={toggleCategory}
            onReset={resetFilters}
          />
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 px-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-0">
            <p className="text-sm text-slate-500" aria-live="polite">
              พบ{" "}
              <span className="font-semibold text-slate-800">
                {filteredProducts.length}
              </span>{" "}
              รายการ
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <span className="whitespace-nowrap">เรียงตาม:</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as CatalogSort)
                  }
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
              <p className="font-semibold text-slate-700">
                ไม่พบสินค้าที่ตรงกับตัวกรอง
              </p>
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
