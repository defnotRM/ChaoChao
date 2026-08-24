"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Grid2X2, Heart, List } from "lucide-react";

import type { Product } from "@/lib/types/product";
import ProductCard from "./ProductCard";

type SavedProductCollectionProps = {
  products: Product[];
};

type SavedLayout = "grid" | "list";
type SavedSort = "default" | "rating" | "price-asc" | "price-desc";

export default function SavedProductCollection({
  products,
}: SavedProductCollectionProps) {
  const [savedIds, setSavedIds] = useState(() =>
    products.map((product) => product.id),
  );
  const [layout, setLayout] = useState<SavedLayout>("grid");
  const [sortBy, setSortBy] = useState<SavedSort>("default");

  const savedProducts = useMemo(() => {
    const matches = products.filter((product) => savedIds.includes(product.id));

    if (sortBy === "rating") {
      return [...matches].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === "price-asc") {
      return [...matches].sort((a, b) => a.pricePerDay - b.pricePerDay);
    }
    if (sortBy === "price-desc") {
      return [...matches].sort((a, b) => b.pricePerDay - a.pricePerDay);
    }
    return matches;
  }, [products, savedIds, sortBy]);

  return (
    <div>
      <header className="mb-8 border-b border-slate-200 pb-6 sm:mb-9 sm:flex sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1b3554] sm:text-3xl">
            สินค้าที่บันทึก
          </h1>
          <p className="mt-2 text-base text-slate-500 sm:text-lg">
            อุปกรณ์ที่คุณสนใจ ({savedProducts.length} รายการ)
          </p>
        </div>

        {savedProducts.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">
            <label className="relative flex h-11 items-center rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
              <ArrowUpDown
                aria-hidden="true"
                className="ml-3.5 h-4 w-4 text-slate-400"
              />
              <span className="ml-2 text-xs text-slate-400">เรียงตาม</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SavedSort)}
                aria-label="เรียงลำดับสินค้าที่บันทึก"
                className="h-full cursor-pointer appearance-none bg-transparent py-0 pl-2 pr-8 text-sm font-semibold text-[#1b3554] outline-none"
              >
                <option value="default">ล่าสุด</option>
                <option value="rating">คะแนนสูงสุด</option>
                <option value="price-asc">ราคาต่ำสุด</option>
                <option value="price-desc">ราคาสูงสุด</option>
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"
              >
                ▼
              </span>
            </label>

            <div
              className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
              role="group"
              aria-label="รูปแบบการแสดงสินค้า"
            >
              <button
                type="button"
                onClick={() => setLayout("grid")}
                aria-label="แสดงแบบตาราง"
                aria-pressed={layout === "grid"}
                title="Grid"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  layout === "grid"
                    ? "bg-[#1b3554] text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-50 hover:text-[#1b3554]"
                }`}
              >
                <Grid2X2 aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                aria-label="แสดงแบบรายการ"
                aria-pressed={layout === "list"}
                title="List"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  layout === "list"
                    ? "bg-[#1b3554] text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-50 hover:text-[#1b3554]"
                }`}
              >
                <List aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {savedProducts.length > 0 ? (
        <div
          className={
            layout === "grid"
              ? "grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
              : "grid max-w-4xl gap-4"
          }
        >
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              listing={product}
              layout={layout}
              initialSaved
              onSavedChange={(saved) => {
                if (!saved) {
                  setSavedIds((current) =>
                    current.filter((id) => id !== product.id),
                  );
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart aria-hidden="true" className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-[#1b3554]">
            ยังไม่มีสินค้าที่บันทึกไว้
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            กดรูปหัวใจบนสินค้าที่สนใจ แล้วกลับมาดูได้ที่หน้านี้
          </p>
          <Link
            href="/renter/hireproduct"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#1b3554] px-5 text-sm font-semibold text-white transition hover:bg-[#000f22]"
          >
            ค้นหาสินค้า
          </Link>
        </div>
      )}
    </div>
  );
}
