import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";

import { ProductCard } from "@/components/products/ProductCard";
import {
  CategoryIcon,
  SectionHeading,
} from "@/components/products/designSystem";
import { getMockItemCategories, getMockProducts } from "@/lib/mock/product";

const popularCategoryIcons = ["camera", "speaker", "tent", "wrench"];

const trust = [
  { icon: BadgeCheck, title: "ยืนยันตัวตน", desc: "ผู้ใช้ผ่านการยืนยัน KYC" },
  { icon: ShieldCheck, title: "มีเงินมัดจำ", desc: "คุ้มครองทั้งสองฝ่าย" },
  { icon: Camera, title: "หลักฐานรูปภาพ", desc: "บันทึกสภาพก่อน–หลัง" },
  { icon: Star, title: "มีรีวิว", desc: "ให้คะแนนหลังจบการเช่า" },
  { icon: MessageCircle, title: "แชทในแอป", desc: "คุยกับคู่สัญญาได้ทันที" },
];

const gettingStartedOptions = [
  {
    title: "ผู้เช่า",
    description: "ค้นหาและเช่าอุปกรณ์ที่ต้องการได้อย่างมั่นใจ",
    icon: Search,
    href: "/renter/hireproduct",
    action: "ค้นหาอุปกรณ์",
    features: [
      "เลือกสินค้าจากหลากหลายหมวดหมู่",
      "กรองราคา คะแนน และวันที่ต้องการเช่า",
      "ดูรีวิวและจุดนัดรับก่อนตัดสินใจ",
      "มีระบบมัดจำและหลักฐานรูปภาพ",
    ],
  },
  {
    title: "ผู้ให้เช่า",
    description: "เปลี่ยนอุปกรณ์ที่มีให้สร้างรายได้เพิ่มเติม",
    icon: Store,
    href: "/lender/addmyproductList",
    action: "เริ่มลงประกาศ",
    features: [
      "สร้างประกาศพร้อมรายละเอียดได้ง่าย",
      "กำหนดค่าเช่า มัดจำ และวันว่างได้เอง",
      "จัดการรายการเช่าผ่านแดชบอร์ด",
      "ติดต่อผู้เช่าและติดตามสถานะได้สะดวก",
    ],
  },
];


export default function Home() {
  const products = getMockProducts();
  const featured = products.slice(0, 8);
  const popularCategories = getMockItemCategories().slice(0, 4);

  return (
    <div className="pb-16 pt-8 sm:pb-20 sm:pt-10">
      <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:space-y-16 sm:px-6 lg:space-y-20 lg:px-8">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        {/* Getting started */}
        <section>
          <div className="mb-7 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
              เลือกเส้นทางของคุณ
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1b3554] sm:text-3xl">
              เริ่มต้นใช้งานเลย!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              ไม่ว่าจะต้องการเช่า หรือปล่อยของให้สร้างรายได้
              เลือกเส้นทางที่เหมาะกับคุณได้เลย
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {gettingStartedOptions.map((option) => (
              <article
                key={option.title}
                className="group relative flex min-h-[26rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <option.icon aria-hidden="true" className="h-5 w-5" />
                </span>

                <h3 className="mt-5 text-lg font-semibold text-slate-800">
                  {option.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {option.description}
                </p>

                <ul className="mt-6 space-y-3.5">
                  {option.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 fill-[#1b3554] text-white"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Link
                    href={option.href}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1b3554] bg-white px-4 text-sm font-semibold text-[#1b3554] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  >
                    {option.action}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>

                <div
                  aria-hidden="true"
                  className="absolute -bottom-16 -right-14 h-40 w-40 rounded-full bg-sky-100/40 blur-2xl transition group-hover:scale-110"
                />
              </article>
            ))}
          </div>
        </section>

        {/* Trust features */}
        <section className="pb-2">
          <div className="mx-auto mb-7 max-w-2xl text-center">
            <h2 className="text-xl font-semibold tracking-tight text-[#1b3554] sm:text-2xl">
              ทำไมต้อง CHAOCHAO
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              ระบบที่ช่วยให้ทั้งผู้เช่าและผู้ให้เช่าทำรายการได้อย่างสบายใจ
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {trust.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition group-hover:bg-sky-100">
                  <item.icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
