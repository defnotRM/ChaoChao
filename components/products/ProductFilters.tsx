import { RotateCcw, Star } from "lucide-react";

import type {
  ProductCategoryOption,
  ProductFilterState,
} from "./productCatalogLogic";
import DateRangeCalendar from "./DateRangeCalendar";

type ProductFiltersProps = {
  categories: ProductCategoryOption[];
  filters: ProductFilterState;
  invalidPriceRange: boolean;
  invalidDateRange: boolean;
  onChange: (patch: Partial<ProductFilterState>) => void;
  onToggleCategory: (categoryId: string) => void;
  onReset: () => void;
};

const ratingOptions = [
  { value: 0, label: "ทั้งหมด", description: "ทุกคะแนน" },
  { value: 1, label: "1+", description: "1.0–1.9 ดาว" },
  { value: 2, label: "2+", description: "2.0–2.9 ดาว" },
  { value: 3, label: "3+", description: "3.0–3.9 ดาว" },
  { value: 4, label: "4+", description: "4.0–4.9 ดาว" },
  { value: 5, label: "5", description: "5.0 ดาว" },
] as const;

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
        <legend className="mb-2 text-sm font-semibold leading-none text-slate-800">
          ช่วงคะแนนรีวิว
        </legend>
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((option) => {
            const isSelected = filters.ratingBand === option.value;

            return (
              <label
                key={option.value}
                title={option.description}
                className={`relative inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-sky-200 focus-within:ring-offset-1 ${
                  isSelected
                    ? "border-[#1b3554] bg-[#1b3554] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50"
                }`}
              >
                {option.value > 0 && (
                  <Star
                    aria-hidden="true"
                    className={`h-4 w-4 fill-current ${
                      isSelected ? "text-amber-300" : "text-amber-500"
                    }`}
                  />
                )}
                <span>{option.label}</span>

                <input
                  type="radio"
                  name="rating-band"
                  value={option.value}
                  checked={isSelected}
                  aria-label={`${option.label} (${option.description})`}
                  onChange={() => onChange({ ratingBand: option.value })}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-slate-100 pt-2">
        <legend className="mb-1 text-sm font-semibold leading-none text-slate-800">
          วันที่ต้องการเช่า
        </legend>
        <DateRangeCalendar
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(range) => onChange(range)}
        />
        {invalidDateRange && (
          <p className="mt-2 text-xs text-rose-600">
            วันที่คืนต้องไม่อยู่ก่อนวันที่เริ่มเช่า
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          สินค้าต้องว่างรวมทั้งวันเริ่มและวันคืน
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
