"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Heart, MapPin } from "lucide-react";

import type { Product } from "@/lib/types/product";
import { PlaceholderImage, Rating, StatusChip } from "./primitives";

type ProductCardProps = {
  listing: Product;
  layout?: "grid" | "list";
};

const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function thb(value: number) {
  return thbFormatter.format(value);
}

function ListingStatus({ status }: { status: Product["status"] }) {
  if (status === "available") {
    return <StatusChip tone="success">พร้อมให้เช่า</StatusChip>;
  }
  if (status === "rented") {
    return <StatusChip tone="rented">ปล่อยเช่าแล้ว</StatusChip>;
  }
  if (status === "maintenance") {
    return <StatusChip tone="maintenance">กำลังซ่อม</StatusChip>;
  }
  return <StatusChip tone="inactive">ปิดประกาศ</StatusChip>;
}

export function ProductCard({
  listing,
  layout = "grid",
}: ProductCardProps) {
  const [saved, setSaved] = useState(false);

  const saveButton = (
    <button
      type="button"
      onClick={() => setSaved((current) => !current)}
      aria-label={saved ? `เลิกบันทึก ${listing.title}` : `บันทึก ${listing.title}`}
      aria-pressed={saved}
      className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
    >
      <Heart
        aria-hidden="true"
        className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`}
      />
    </button>
  );

  if (layout === "list") {
    return (
      <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md">
        {saveButton}
        <Link
          href={`/product/${listing.id}`}
          className="flex gap-3 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:gap-4"
        >
          <PlaceholderImage
            seed={listing.imageSeeds[0]}
            className="h-28 w-28 shrink-0 sm:h-32 sm:w-32"
          />

          <div className="min-w-0 flex-1 pr-9">
            <h3 className="line-clamp-2 font-semibold leading-snug text-slate-800 transition group-hover:text-sky-700">
              {listing.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Rating value={listing.rating} count={listing.reviewCount} />
              <ListingStatus status={listing.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-1">
              <span className="text-lg font-bold text-[#1b3554]">
                {thb(listing.pricePerDay)}
              </span>
              <span className="text-xs text-slate-500">/ วัน</span>
              <span className="ml-auto text-xs text-slate-500">
                มัดจำ {thb(listing.deposit)}
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
      {saveButton}
      <Link
        href={`/product/${listing.id}`}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-600"
      >
        <div className="relative">
          <PlaceholderImage
            seed={listing.imageSeeds[0]}
            className="aspect-[4/3] w-full"
            rounded="rounded-none"
          />
          <div className="absolute bottom-2 left-2">
            <ListingStatus status={listing.status} />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-slate-800 transition group-hover:text-sky-700">
            {listing.title}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Rating value={listing.rating} count={listing.reviewCount} />
            {listing.ownerVerified && (
              <StatusChip tone="info" dot={false} className="px-2">
                <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                ยืนยันตัวตน
              </StatusChip>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1 border-t border-slate-200 pt-2">
            <span className="text-lg font-bold text-[#1b3554]">
              {thb(listing.pricePerDay)}
            </span>
            <span className="text-xs text-slate-500">/ วัน</span>
            <span className="ml-auto text-[11px] text-slate-500">
              มัดจำ {thb(listing.deposit)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
