import { RotateCcw } from "lucide-react";

import type {
  ProductCategoryOption,
  ProductFilterState,
} from "./productCatalogLogic";

type ProductFiltersProps = {
  categories: ProductCategoryOption[];
  filters: ProductFilterState;
  invalidPriceRange: boolean;
  invalidDateRange: boolean;
  onChange: (patch: Partial<ProductFilterState>) => void;
  onToggleCategory: (categoryId: string) => void;
  onReset: () => void;
};

export default function ProductFilters({
  categories,
  filters,
  invalidPriceRange,
  invalidDateRange,
  onChange,
  onToggleCategory,
  onReset,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#1b3554]">ตัวกรอง</h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-sky-700"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          ล้าง
        </button>
      </div>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">
          หมวดหมู่
        </legend>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"
            >
              <input
                type="checkbox"
                checked={filters.selectedCategoryIds.includes(category.id)}
                onChange={() => onToggleCategory(category.id)}
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
              value={filters.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
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
              value={filters.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value })}
              placeholder="สูงสุด"
              className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>
        {invalidPriceRange && (
          <p className="mt-2 text-xs text-rose-600">
            ราคาต่ำสุดต้องไม่เกินราคาสูงสุด
          </p>
        )}
      </fieldset>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">
          คะแนนรีวิว
        </legend>
        <select
          value={filters.minRating}
          onChange={(event) =>
            onChange({ minRating: Number(event.target.value) })
          }
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
            <span className="mb-1 block text-xs text-slate-500">
              วันที่เริ่มเช่า
            </span>
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(event) => onChange({ startDate: event.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">วันที่คืน</span>
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(event) => onChange({ endDate: event.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>
        {invalidDateRange && (
          <p className="mt-2 text-xs text-rose-600">
            วันที่คืนต้องไม่อยู่ก่อนวันที่เริ่มเช่า
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          สินค้าต้องว่างครบตลอดช่วงวันที่เลือก
        </p>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-3">
        <input
          type="checkbox"
          checked={filters.onlyAvailable}
          onChange={(event) =>
            onChange({ onlyAvailable: event.target.checked })
          }
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
}
