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

export default async function HireProductDetailPage({
  params,
}: PageProps<"/renter/hireproduct/[id]">) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-[#f8fafc] pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/renter/hireproduct"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1b3554] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          กลับไปหน้าค้นหาอุปกรณ์
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
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  {product.locations.length} จุดนัดรับ
                </span>
              </div>
            </header>

            <section aria-labelledby="price-heading">
              <h2 id="price-heading" className="text-xl font-semibold text-[#1b3554]">
                ค่าเช่าและข้อมูลสินค้า
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Clock3 aria-hidden="true" className="h-5 w-5 text-sky-600" />
                  <p className="mt-3 text-xs text-slate-500">ค่าเช่าต่อวัน</p>
                  <p className="mt-1 text-xl font-semibold text-[#1b3554]">
                    {thbFormatter.format(product.pricePerDay)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <WalletCards aria-hidden="true" className="h-5 w-5 text-sky-600" />
                  <p className="mt-3 text-xs text-slate-500">เงินมัดจำ</p>
                  <p className="mt-1 text-xl font-semibold text-[#1b3554]">
                    {thbFormatter.format(product.deposit)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Tag aria-hidden="true" className="h-5 w-5 text-sky-600" />
                  <p className="mt-3 text-xs text-slate-500">ราคาเต็ม</p>
                  <p className="mt-1 text-lg font-semibold text-[#1b3554]">
                    {thbFormatter.format(product.originalPrice)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Star
                    aria-hidden="true"
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                  />
                  <p className="mt-3 text-xs text-slate-500">คะแนนจากผู้เช่า</p>
                  <p className="mt-1 text-lg font-semibold text-[#1b3554]">
                    {product.rating.toFixed(1)} / 5
                  </p>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="description-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 id="description-heading" className="text-xl font-semibold text-[#1b3554]">
                รายละเอียดอุปกรณ์
              </h2>
              <p className="mt-3 leading-8 text-slate-600">{product.description}</p>
            </section>

            <section
              aria-labelledby="terms-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="terms-heading" className="text-xl font-semibold text-[#1b3554]">
                    เงื่อนไขการเช่า
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    โปรดอ่านและยอมรับเงื่อนไขก่อนส่งคำขอเช่า
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {product.rentalTerms.map((term) => (
                  <li key={term} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                    />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="owner-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 id="owner-heading" className="text-xl font-semibold text-[#1b3554]">
                ข้อมูลผู้ให้เช่า
              </h2>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <span
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-2xl font-semibold text-[#1b3554]"
                >
                  {product.owner.displayName.replace("คุณ", "").charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {product.owner.displayName}
                    </h3>
                    {product.owner.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                        <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                        ยืนยันตัวตนแล้ว
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Star
                        aria-hidden="true"
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                      {product.owner.rating.toFixed(1)} ({product.owner.reviewCount} รีวิว)
                    </span>
                    <span>สมาชิกตั้งแต่ {formatTimestamp(product.owner.joinedAt)}</span>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1b3554] px-4 text-sm font-semibold text-[#1b3554] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                  ส่งข้อความ
                </Link>
              </div>
            </section>

            <section
              aria-labelledby="location-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 id="location-heading" className="text-xl font-semibold text-[#1b3554]">
                จุดนัดรับอุปกรณ์
              </h2>
              <div className="mt-4 divide-y divide-slate-100">
                {product.locations.map((location) => (
                  <div key={location.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <MapPin aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-800">{location.description}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {location.fullAddress}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="availability-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CalendarDays aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="availability-heading" className="text-xl font-semibold text-[#1b3554]">
                    ช่วงวันที่พร้อมให้เช่า
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">เลือกวันเช่าจากช่วงที่เปิดให้จอง</p>
                </div>
              </div>

              {product.availability.length > 0 ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {product.availability.map((period) => (
                    <li
                      key={`${period.startDate}-${period.endDate}`}
                      className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-slate-700"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-emerald-600"
                      />
                      <span>
                        {formatDate(period.startDate)} – {formatDate(period.endDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  ยังไม่มีช่วงวันที่เปิดให้เช่าในขณะนี้
                </p>
              )}
            </section>

            <section
              aria-labelledby="reviews-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="reviews-heading" className="text-xl font-semibold text-[#1b3554]">
                    รีวิวจากผู้เช่า
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    คะแนนรวม {product.rating.toFixed(1)} จาก {product.reviewCount} รีวิว
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
                  <Star
                    aria-hidden="true"
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                  {product.rating.toFixed(1)} / 5
                </span>
              </div>

              {product.reviews.length > 0 ? (
                <div className="mt-5 divide-y divide-slate-100">
                  {product.reviews.map((review) => (
                    <article key={review.id} className="py-5 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600"
                        >
                          {review.reviewerName.charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {review.reviewerName}
                              </h3>
                              <div
                                className="mt-1 flex gap-0.5"
                                aria-label={`ให้คะแนน ${review.rating} จาก 5`}
                              >
                                {Array.from({ length: 5 }, (_, index) => (
                                  <Star
                                    key={index}
                                    aria-hidden="true"
                                    className={`h-3.5 w-3.5 ${
                                      index < review.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-slate-100 text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <time
                              dateTime={review.createdAt}
                              className="text-xs text-slate-400"
                            >
                              {formatTimestamp(review.createdAt)}
                            </time>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  สินค้านี้ยังไม่มีรีวิว
                </p>
              )}
            </section>
          </article>

          <div className="lg:sticky lg:top-6">
            <BookingWidget
              productId={product.id}
              pricePerDay={product.pricePerDay}
              deposit={product.deposit}
              ownerId={product.ownerId}
              ownerName={product.owner.displayName}
              ownerIsVerified={product.owner.isVerified}
              ownerRating={product.owner.rating}
              ownerReviewCount={product.owner.reviewCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
