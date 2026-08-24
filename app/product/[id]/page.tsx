import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Star,
  Tag,
  WalletCards,
} from "lucide-react";

import BookingWidget from "@/components/products/BookingWidget";
import { StatusChip } from "@/components/products/designSystem";
import ProductGallery from "@/components/products/ProductGallery";
import { getProductById } from "@/lib/products/queries";
import type { ItemStatus } from "@/lib/types/product";

const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const statusContent: Record<
  ItemStatus,
  { label: string; tone: "success" | "rented" | "maintenance" | "inactive" }
> = {
  available: { label: "พร้อมให้เช่า", tone: "success" },
  rented: { label: "กำลังถูกเช่า", tone: "rented" },
  maintenance: { label: "อยู่ระหว่างซ่อมบำรุง", tone: "maintenance" },
  inactive: { label: "ปิดประกาศ", tone: "inactive" },
};

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00+07:00`));
}

function formatTimestamp(date: string) {
  return dateFormatter.format(new Date(date));
}

function ProductStatus({ status }: { status: ItemStatus }) {
  const content = statusContent[status];
  return <StatusChip tone={content.tone}>{content.label}</StatusChip>;
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-[#f8fafc] pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1b3554] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          กลับไปหน้ารายการสินค้าทั้งหมด
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-10">
          <article className="min-w-0 space-y-7">
            <ProductGallery imageUrls={product.imageUrls} title={product.title} />

            <header className="border-b border-slate-200 pb-7">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {product.categoryName}
                </span>
                <ProductStatus status={product.status} />
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#000f22] sm:text-4xl">
                {product.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span
                  className="inline-flex items-center gap-1.5"
                  aria-label={`คะแนน ${product.rating.toFixed(1)} จาก ${product.reviewCount} รีวิว`}
                >
                  <Star
                    aria-hidden="true"
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                  <strong className="font-semibold text-slate-700">
                    {product.rating.toFixed(1)}
                  </strong>
                  <span>({product.reviewCount} รีวิว)</span>
                </span>

                <span className="h-4 w-px bg-slate-200" aria-hidden="true" />

                <span className="inline-flex items-center gap-1.5">
                  <Tag aria-hidden="true" className="h-4 w-4 text-slate-400" />
                  <span>
                    สภาพ:{" "}
                    <strong className="font-semibold text-slate-700">
                      {product.condition === "like-new"
                        ? "เหมือนใหม่"
                        : product.condition === "good"
                          ? "ดี"
                          : "พอใช้"}
                    </strong>
                  </span>
                </span>

                <span className="h-4 w-px bg-slate-200" aria-hidden="true" />

                <span className="inline-flex items-center gap-1.5">
                  <WalletCards
                    aria-hidden="true"
                    className="h-4 w-4 text-slate-400"
                  />
                  <span>
                    ราคาซื้อใหม่โดยประมาณ:{" "}
                    <strong className="font-semibold text-slate-700">
                      {thbFormatter.format(product.originalPrice)}
                    </strong>
                  </span>
                </span>
              </div>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-slate-900">
                รายละเอียดอุปกรณ์
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {product.description}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-slate-900">
                จุดนัดรับและคืนอุปกรณ์
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                คุณสามารถเลือกจุดนัดรับที่สะดวกได้ในขั้นตอนการขอเช่า
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.locations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
                      />
                      <div className="min-w-0 flex-1">
                        <strong className="block text-sm font-semibold text-slate-800">
                          {location.description}
                        </strong>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {location.fullAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-slate-900">
                ข้อกำหนดและเงื่อนไขการเช่า
              </h2>
              <ul className="mt-4 space-y-2.5">
                {product.rentalTerms.map((term, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-sm text-slate-600"
                  >
                    <ClipboardCheck
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
                    />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </section>

            {product.availability.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    aria-hidden="true"
                    className="h-5 w-5 text-sky-600"
                  />
                  <h2 className="text-lg font-semibold text-slate-900">
                    ช่วงวันที่เปิดให้เช่า
                  </h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.availability.map((range, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"
                    >
                      <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                      {formatDate(range.startDate)} – {formatDate(range.endDate)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    รีวิวจากผู้เช่าจริง
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    ความเห็นจากผู้ใช้งานที่เคยเช่าอุปกรณ์ชิ้นนี้
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5">
                  <Star
                    aria-hidden="true"
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                  <strong className="text-sm font-semibold text-slate-800">
                    {product.rating.toFixed(1)}
                  </strong>
                  <span className="text-xs text-slate-500">
                    / 5.0 ({product.reviewCount} รีวิว)
                  </span>
                </div>
              </header>

              {product.reviews.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  ยังไม่มีรีวิวสำหรับอุปกรณ์นี้
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {product.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                            {review.reviewerName.charAt(0).toUpperCase()}
                          </span>
                          <strong className="text-sm font-semibold text-slate-800">
                            {review.reviewerName}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center gap-0.5"
                            aria-label={`ให้คะแนน ${review.rating} ดาว`}
                          >
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                aria-hidden="true"
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-slate-200 text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <time
                            dateTime={review.createdAt}
                            className="text-xs text-slate-400"
                          >
                            {formatTimestamp(review.createdAt)}
                          </time>
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {review.comment}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </article>

          <aside className="lg:sticky lg:top-24">
            <BookingWidget
              productId={product.id}
              pricePerDay={product.pricePerDay}
              deposit={product.deposit}
              ownerId={product.owner.id}
              ownerName={product.owner.displayName}
              ownerAvatarUrl={product.owner.avatarUrl}
              ownerIsVerified={product.owner.isVerified}
              ownerRating={product.owner.rating}
              ownerReviewCount={product.owner.reviewCount}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
