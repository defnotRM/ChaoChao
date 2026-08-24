"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Heart,
  MessageCircle,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export interface BookingWidgetProps {
  productId: string;
  pricePerDay: number;
  deposit: number;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl?: string | null;
  ownerIsVerified: boolean;
  ownerRating: number;
  ownerReviewCount: number;
}

export default function BookingWidget({
  productId,
  pricePerDay,
  deposit,
  ownerId,
  ownerName,
  ownerAvatarUrl,
  ownerIsVerified,
  ownerRating,
  ownerReviewCount,
}: BookingWidgetProps) {
  // "บันทึก" ยังไม่มีตาราง favorites ใน DB → เก็บสถานะเฉพาะฝั่ง client
  const [saved, setSaved] = useState(false);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* ราคา */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-[#1b3554]">
          {thb.format(pricePerDay)}
        </span>
        <span className="text-sm font-medium text-slate-500">/ วัน</span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        + เงินประกัน{" "}
        <span className="font-semibold text-slate-800">
          {thb.format(deposit)}
        </span>{" "}
        <span className="text-slate-400">(คืนเมื่อจบการเช่า)</span>
      </p>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        เงินประกันพักไว้กับ Chaochao ไม่ได้โอนตรงให้ผู้ปล่อยเช่า
      </p>

      {/* ปุ่มหลัก → หน้าเลือกวันเช่า */}
      <Link
        href={`/product/${productId}/rent`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3.5 text-base font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98]"
      >
        <CalendarDays className="h-5 w-5" />
        <span>เลือกวันที่เช่า →</span>
      </Link>

      <p className="mt-2.5 text-center text-xs leading-relaxed text-slate-400">
        เลือกช่วงวันและจุดนัดรับ–คืนตัวจริง พร้อมราคาสุทธิ ในขั้นตอนถัดไป
      </p>

      {/* การ์ดผู้ปล่อยเช่า */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
        {ownerAvatarUrl ? (
          <img
            src={ownerAvatarUrl}
            alt={ownerName}
            className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-base font-bold text-white">
            {ownerName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-slate-900">
              {ownerName}
            </p>
            {ownerIsVerified && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                <BadgeCheck className="h-4 w-4" />
                ยืนยันตัวตน
              </span>
            )}
          </div>
          {ownerReviewCount > 0 && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-700">
                {ownerRating.toFixed(1)}
              </span>
              <span className="text-slate-400">({ownerReviewCount} รีวิว)</span>
            </p>
          )}
        </div>
        <Link
          href={`/user/${ownerId}`}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
        >
          <User className="h-3.5 w-3.5" />
          ดูโปรไฟล์
        </Link>
      </div>

      {/* ปุ่มคู่: แชท / บันทึก */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          href={`/chat?userId=${ownerId}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          แชท
        </Link>
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
            saved
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-slate-200 bg-white text-slate-700 hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554]"
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
          {saved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
