import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { ProductCard } from "@/components/products/ProductCard";
import {
  CategoryIcon,
  SectionHeading,
} from "@/components/products/designSystem";
import { getMockItemCategories, getMockProducts } from "@/lib/mock/product";

const popularCategoryIcons = ["camera", "speaker", "tent", "wrench"];

export default function Home() {
  const products = getMockProducts();
  const featured = products.slice(0, 4);
  const popularCategories = getMockItemCategories().slice(0, 4);

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-slate-50 p-6 shadow-sm sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl"
          />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
              <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
              แพลตฟอร์มเช่าอุปกรณ์ที่คุณวางใจได้
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#000f22] sm:text-4xl md:text-5xl">
              เช่าอุปกรณ์ที่ต้องการ
              <br />
              <span className="text-sky-600">ปล่อยเช่าของที่มี</span>{" "}
              ได้ในที่เดียว
            </h1>

            <p className="mt-3 max-w-xl leading-relaxed text-slate-600">
              CHAOCHAO เชื่อมต่อผู้เช่าและผู้ให้เช่าอุปกรณ์อย่างปลอดภัย
              ยืนยันตัวตน มีมัดจำ หลักฐานรูปภาพ และรีวิวครบทุกขั้นตอน
            </p>

            <Link
              href="/renter/hireproduct"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-[#1b3554] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#000f22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              Start Now
            </Link>
          </div>
        </section>

        <section>
          <SectionHeading
            title="หมวดหมู่ยอดนิยม"
            action={
              <Link
                href="/renter/hireproduct"
                className="inline-flex items-center gap-1 text-sm font-medium text-info hover:underline"
              >
                ดูทั้งหมด <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {popularCategories.map((category, index) => {
              const itemCount = products.filter(
                (product) =>
                  product.categoryId === String(category.category_id),
              ).length;

              return (
                <Link
                  key={category.category_id}
                  href="/renter/hireproduct"
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition group-hover:bg-sky-100">
                    <CategoryIcon
                      name={popularCategoryIcons[index]}
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="block text-sm font-semibold text-slate-800">
                    {category.category_name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {itemCount} รายการ
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            title="อุปกรณ์แนะนำ"
            action={
              <Link
                href="/renter/hireproduct"
                className="inline-flex items-center gap-1 text-sm font-medium text-info hover:underline"
              >
                ดูทั้งหมด <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} listing={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
