"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";

import type { BookingDraft, BookingPageData, DateRange } from "./types";

/* ────────────────────────────── ค่าคงที่ (UI rules) ──────────────────────────────
 * ค่าเหล่านี้เป็นกติกาฝั่ง UI ที่ยังไม่ผูกกับ schema — ปรับได้อิสระ
 */
const LONG_RENTAL_MIN_DAYS = 3; // เช่า 3 วันขึ้นไปได้ส่วนลด
const LONG_RENTAL_DISCOUNT_RATE = 0.1; // -10%
const PLATFORM_FEE_RATE = 0; // ค่าธรรมเนียมแพลตฟอร์ม (ยังไม่กำหนดใน DB → 0)

const DRAFT_STORAGE_KEY = "chaochao:bookingDraft";

const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

// pin timezone ให้ SSR กับ client ตรงกัน (กัน hydration mismatch)
const monthTitleFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  month: "long",
  year: "numeric",
});

const longDateFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const joinedFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  month: "short",
  year: "numeric",
});

/* ────────────────────────────── date helpers ────────────────────────────── */

function pad(value: number) {
  return String(value).padStart(2, "0");
}

// สร้าง key "YYYY-MM-DD"
function keyOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function keyToDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function inclusiveDays(startKey: string, endKey: string) {
  const diff = keyToDate(endKey).getTime() - keyToDate(startKey).getTime();
  return Math.max(1, Math.round(diff / 86_400_000) + 1);
}

function inRanges(key: string, ranges: DateRange[]) {
  return ranges.some((r) => key >= r.start && key <= r.end);
}

function monthValue(year: number, month: number) {
  return year * 12 + month;
}

/* ────────────────────────────── component ────────────────────────────── */

export default function BookingClient({ data }: { data: BookingPageData }) {
  const { item, owner, locations, availability, bookedRanges, rating } = data;
  const router = useRouter();

  const todayKey = useMemo(() => {
    const now = new Date();
    return keyOf(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // ขอบเขตเดือนที่เลื่อนดูได้ = ช่วง availability ที่เปิดจอง หรือเริ่มต้นจากเดือนปัจจุบันไปข้างหน้า 12 เดือน
  const bounds = useMemo(() => {
    const now = new Date();
    const currentMonth = monthValue(now.getFullYear(), now.getMonth());
    if (availability.length === 0) {
      return { min: currentMonth, max: currentMonth + 11 };
    }
    const starts = availability.map((a) => keyToDate(a.start));
    const ends = availability.map((a) => keyToDate(a.end));
    const minDate = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...ends.map((d) => d.getTime())));
    return {
      min: Math.min(currentMonth, monthValue(minDate.getFullYear(), minDate.getMonth())),
      max: Math.max(currentMonth + 11, monthValue(maxDate.getFullYear(), maxDate.getMonth())),
    };
  }, [availability]);

  const [viewMonth, setViewMonth] = useState(bounds.min); // year*12 + month
  const [startKey, setStartKey] = useState<string | null>(null);
  const [endKey, setEndKey] = useState<string | null>(null);
  const [pickupId, setPickupId] = useState<string | null>(
    locations.length === 1 ? locations[0].id : null
  );
  const [returnId, setReturnId] = useState<string | null>(
    locations.length === 1 ? locations[0].id : null
  );
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  const viewYear = Math.floor(viewMonth / 12);
  const viewMonthIndex = viewMonth % 12;

  const isPast = (key: string) => key < todayKey;
  const isBooked = (key: string) => inRanges(key, bookedRanges);
  const isOpen = (key: string) => {
    if (availability.length === 0) return !isPast(key);
    return inRanges(key, availability) && !isPast(key);
  };
  const isSelectable = (key: string) => isOpen(key) && !isBooked(key) && item.status === "available";

  // ไม่ให้ช่วงคร่อมวันที่ถูกจอง/นอกช่วงเปิดจอง
  function spanIsClear(from: string, to: string) {
    const start = keyToDate(from);
    const end = keyToDate(to);
    for (
      let t = start.getTime();
      t <= end.getTime();
      t += 86_400_000
    ) {
      const d = new Date(t);
      const k = keyOf(d.getFullYear(), d.getMonth(), d.getDate());
      if (!isSelectable(k)) return false;
    }
    return true;
  }

  function handleDayClick(key: string) {
    if (!isSelectable(key)) return;
    setDraft(null); // แก้วันแล้ว draft เดิมล้าสมัย

    // เริ่มเลือกใหม่
    if (!startKey || (startKey && endKey)) {
      setStartKey(key);
      setEndKey(null);
      return;
    }
    // มี start แล้ว กำลังเลือก end
    if (key < startKey) {
      setStartKey(key);
      return;
    }
    if (spanIsClear(startKey, key)) {
      setEndKey(key);
    } else {
      // ช่วงคร่อมวันที่จองไม่ได้ → เริ่มต้นใหม่ที่วันที่คลิก
      setStartKey(key);
      setEndKey(null);
    }
  }

  /* ── month grid ── */
  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonthIndex, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonthIndex + 1, 0).getDate();
    const list: Array<{ key: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push({ key: keyOf(viewYear, viewMonthIndex, d), day: d });
    }
    return list;
  }, [viewYear, viewMonthIndex]);

  /* ── pricing ── */
  const days = startKey && endKey ? inclusiveDays(startKey, endKey) : 0;
  const rentalBase = days * item.rentalFeePerDay;
  const discount =
    days >= LONG_RENTAL_MIN_DAYS
      ? Math.round(rentalBase * LONG_RENTAL_DISCOUNT_RATE)
      : 0;
  const rentalFee = rentalBase - discount;
  const platformFee = Math.round(rentalFee * PLATFORM_FEE_RATE);
  const netIncome = rentalFee - platformFee;
  const totalPayable = rentalFee + item.deposit;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canContinue = Boolean(startKey && endKey && pickupId && returnId);

  async function handleSubmitBooking() {
    if (!canContinue || !startKey || !endKey) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const pickup = locations.find((l) => l.id === pickupId);
      const returnLoc = locations.find((l) => l.id === returnId);

      const payload = {
        itemId: item.id,
        startDate: startKey,
        endDate: endKey,
        meetupLocation: pickup?.description || pickup?.fullAddress || "จุดนัดรับที่ตกลงกัน",
        returnLocation: returnLoc?.description || returnLoc?.fullAddress || "จุดนัดคืนที่ตกลงกัน",
        rentalFee,
        deposit: item.deposit,
        totalPaid: totalPayable,
      };

      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        setSubmitError(result.message || "ส่งคำขอเช่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      // ส่งคำขอเช่าสำเร็จ นำผู้เช่าไปจัดการสถานะต่อใน Dashboard
      const targetUserId = result.userId || "8a88d60a-e2cf-43a6-b4ea-baa9347bfee1";
      router.push(`/dashboard/${targetUserId}/rent/${result.orderId}`);
    } catch (err) {
      console.error("Submit booking error:", err);
      setSubmitError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  }

  const atMinMonth = viewMonth <= bounds.min;
  const atMaxMonth = viewMonth >= bounds.max;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="เส้นทางนำทาง"
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"
        >
          <Link href="/" className="transition hover:text-[#1b3554]">
            หน้าแรก
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/products"
            className="transition hover:text-[#1b3554]"
          >
            สินค้าสำหรับเช่า
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/product/${item.id}`}
            className="max-w-[16rem] truncate font-medium text-slate-700 hover:text-[#1b3554]"
          >
            {item.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">จองเช่าอุปกรณ์</span>
        </nav>

        <Link
          href={`/product/${item.id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1b3554]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          กลับไปหน้ารายละเอียดอุปกรณ์
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            เลือกวันที่เช่า &amp; จุดนัดรับ–คืน
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            เลือกช่วงวันที่ต้องการเช่า และจุดนัดรับ–คืนอุปกรณ์
            จากนั้นกดส่งคำขอเช่าเพื่อดำเนินการในแดชบอร์ด
          </p>
        </header>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
          {/* ───────────── คอลัมน์ซ้าย ───────────── */}
          <div className="min-w-0 space-y-6">
            {/* ปฏิทินคิวว่าง */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      ปฏิทินคิวว่าง
                    </h2>
                    <p className="text-xs text-slate-500">{item.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMonth((v) => v - 1)}
                    disabled={atMinMonth}
                    aria-label="เดือนก่อนหน้า"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#3f6593] hover:text-[#1b3554] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="w-32 text-center text-sm font-semibold text-slate-800">
                    {monthTitleFmt.format(
                      new Date(viewYear, viewMonthIndex, 1)
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((v) => v + 1)}
                    disabled={atMaxMonth}
                    aria-label="เดือนถัดไป"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#3f6593] hover:text-[#1b3554] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* หัวตารางวัน */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="py-1.5">
                    {label}
                  </div>
                ))}
              </div>

              {/* วัน */}
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((cell, index) => {
                  if (!cell) return <div key={`empty-${index}`} />;
                  const { key, day } = cell;
                  const booked = isBooked(key);
                  const open = isOpen(key);
                  const selectable = open && !booked;
                  const isStart = key === startKey;
                  const isEnd = key === endKey;
                  const isEndpoint = isStart || isEnd;
                  const inRange =
                    startKey &&
                    endKey &&
                    key > startKey &&
                    key < endKey;
                  // ระหว่างเลือก: ไฮไลต์ start เดี่ยว ๆ ด้วย
                  const activeSingle = isStart && !endKey;

                  let cls =
                    "text-slate-700 hover:bg-sky-50 hover:text-[#1b3554]";
                  if (!open) {
                    cls = "text-slate-300";
                  } else if (booked) {
                    cls =
                      "bg-rose-50 text-rose-400 line-through decoration-rose-300";
                  } else if (isEndpoint || activeSingle) {
                    cls =
                      "bg-[#1b3554] text-white font-bold shadow-sm shadow-[#1b3554]/20";
                  } else if (inRange) {
                    cls = "bg-[#c0e6fd]/60 text-[#1b3554] font-semibold";
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!selectable}
                      onClick={() => handleDayClick(key)}
                      aria-pressed={isEndpoint}
                      aria-label={`${longDateFmt.format(keyToDate(key))}${
                        booked
                          ? " ถูกจองแล้ว"
                          : !open
                          ? " นอกช่วงเปิดจอง"
                          : ""
                      }`}
                      className={`flex aspect-square items-center justify-center rounded-lg text-sm transition ${cls} ${
                        selectable ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <LegendDot className="bg-[#1b3554]" label="วันที่เลือก" />
                <LegendDot className="bg-[#c0e6fd]/70" label="ในช่วงเช่า" />
                <LegendDot className="bg-white ring-1 ring-slate-200" label="ว่าง" />
                <LegendDot className="bg-rose-100" label="ถูกจองแล้ว" />
                <LegendDot className="bg-slate-100" label="นอกช่วงเปิดจอง" />
              </div>

              {startKey && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-[#1b3554]">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  {endKey ? (
                    <span>
                      เลือก{" "}
                      <strong>{longDateFmt.format(keyToDate(startKey))}</strong>{" "}
                      ถึง{" "}
                      <strong>{longDateFmt.format(keyToDate(endKey))}</strong> (
                      {days} วัน)
                    </span>
                  ) : (
                    <span>
                      เริ่ม{" "}
                      <strong>{longDateFmt.format(keyToDate(startKey))}</strong>{" "}
                      — เลือกวันสิ้นสุดอีกครั้ง
                    </span>
                  )}
                </div>
              )}
            </section>

            {/* จุดรับ–คืน */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                  <MapPin className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  จุดนัดรับ–คืนอุปกรณ์
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <LocationPicker
                  title="จุดรับของ"
                  locations={locations}
                  selectedId={pickupId}
                  onSelect={(id) => {
                    setPickupId(id);
                    setDraft(null);
                  }}
                />
                <LocationPicker
                  title="จุดคืนของ"
                  locations={locations}
                  selectedId={returnId}
                  onSelect={(id) => {
                    setReturnId(id);
                    setDraft(null);
                  }}
                />
              </div>
            </section>

            {/* รายละเอียดเงินประกัน & เงื่อนไข */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  การคุ้มครองและเงินประกัน
                </h2>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    เงินประกัน{" "}
                    <strong className="text-slate-800">
                      {thb.format(item.deposit)}
                    </strong>{" "}
                    จะถูกพักไว้ที่ระบบ Chaochao และคืนเข้าบัญชีคุณเต็มจำนวน
                    เมื่อผู้ให้เช่าตรวจสอบสภาพอุปกรณ์หลังส่งคืนเรียบร้อย
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    ถ่ายรูปหลักฐานสภาพอุปกรณ์ร่วมกันทั้งตอนรับและคืน เพื่อความปลอดภัยทั้งสองฝ่าย
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <span>
                    เช่าตั้งแต่ 3 วันขึ้นไป รับส่วนลดทันที 10% จากค่าเช่าปกติ
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ───────────── คอลัมน์ขวา: สรุปคำสั่งเช่า ───────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              {/* ข้อมูลสินค้าสั้น ๆ */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {thb.format(item.rentalFeePerDay)} / วัน
                  </p>
                </div>
              </div>

              {/* ข้อมูลผู้ให้เช่า */}
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3">
                {owner.avatarUrl ? (
                  <img
                    src={owner.avatarUrl}
                    alt={owner.displayName}
                    className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xs font-bold text-white">
                    {owner.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {owner.displayName}
                    </p>
                    {owner.isVerified && (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    )}
                  </div>
                  {rating && (
                    <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>
                        {rating.average.toFixed(1)} ({rating.count} รีวิว)
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* สรุปราคา */}
              <div className="my-5 border-t border-slate-100 pt-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  สรุปค่าใช้จ่าย
                </h3>

                {days > 0 ? (
                  <dl className="space-y-2.5">
                    <PriceRow
                      label={`ค่าเช่า (${days} วัน × ${thb.format(item.rentalFeePerDay)})`}
                      value={thb.format(rentalBase)}
                    />
                    {discount > 0 && (
                      <PriceRow
                        label="ส่วนลดเช่าระยะยาว (-10%)"
                        value={`-${thb.format(discount)}`}
                        highlight
                      />
                    )}
                    <PriceRow
                      label="เงินประกัน (คืนเมื่อเสร็จสิ้น)"
                      value={thb.format(item.deposit)}
                      muted
                    />

                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-sm font-bold text-slate-900">
                          ยอดรวมที่ต้องชำระ
                        </dt>
                        <dd className="text-xl font-extrabold text-[#1b3554]">
                          {thb.format(totalPayable)}
                        </dd>
                      </div>
                      <p className="mt-1 text-right text-[11px] text-slate-400">
                        (ค่าเช่าสุทธิ {thb.format(rentalFee)} + เงินประกัน {thb.format(item.deposit)})
                      </p>
                    </div>
                  </dl>
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                    เลือกช่วงวันที่เช่าเพื่อดูราคา
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={!canContinue || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3.5 text-base font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>{isSubmitting ? "กำลังส่งคำขอเช่า..." : "ส่งคำขอเช่า"}</span>
              </button>

              {submitError && (
                <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-600">
                  {submitError}
                </div>
              )}

              <p className="mt-2.5 text-center text-xs text-slate-400">
                เมื่อส่งคำขอแล้ว คุณสามารถติดตามและดำเนินการต่อในแดชบอร์ด
              </p>

              {!canContinue && (startKey || pickupId) && (
                <p className="mt-2 text-center text-xs text-amber-600">
                  {!endKey
                    ? "กรุณาเลือกช่วงวันที่เช่าให้ครบ"
                    : "กรุณาเลือกจุดรับและจุดคืนอุปกรณ์"}
                </p>
              )}
            </div>

            {/* แผงยืนยัน */}
            {draft && <DraftPanel draft={draft} />}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── ชิ้นส่วนย่อย ────────────────────────────── */

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}

function LocationPicker({
  title,
  locations,
  selectedId,
  onSelect,
}: {
  title: string;
  locations: BookingPageData["locations"];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
        {title}
      </p>
      {locations.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
          ยังไม่มีจุดนัดสำหรับอุปกรณ์นี้
        </p>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => {
            const selected = loc.id === selectedId;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelect(loc.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-[#3f6593] bg-sky-50 ring-2 ring-sky-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    selected
                      ? "bg-[#1b3554] text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    {loc.description}
                  </span>
                  {loc.fullAddress && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {loc.fullAddress}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriceRow({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className={`text-sm ${muted ? "text-slate-400" : "text-slate-600"}`}>
        {label}
      </dt>
      <dd
        className={`shrink-0 text-sm font-semibold ${
          highlight ? "text-emerald-600" : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function DraftPanel({ draft }: { draft: BookingDraft }) {
  const rows: Array<[string, string]> = [
    ["item_id", draft.item_id],
    ["user_id", draft.user_id ?? "— (รอ auth)"],
    ["start_date", draft.start_date],
    ["end_date", draft.end_date],
    ["meetup_location", draft.meetup_location],
    ["return_location", draft.return_location],
    ["rental_fee", String(draft.rental_fee)],
    ["deposit", String(draft.deposit)],
    ["fee", String(draft.fee)],
    ["net_income", String(draft.net_income)],
    ["total_paid", String(draft.total_paid)],
    ["status", draft.status],
  ];
  return (
    <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-900">
          บันทึกร่างคำขอเรียบร้อย
        </h3>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        ข้อมูลนี้พร้อมส่งต่อไปยังขั้นตอน “ส่งคำขอเช่า” (ยังไม่บันทึกลงฐานข้อมูล)
      </p>
      <dl className="mt-4 divide-y divide-emerald-100 overflow-hidden rounded-xl border border-emerald-100 bg-white text-xs">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start justify-between gap-3 px-3 py-2"
          >
            <dt className="font-mono text-slate-400">{k}</dt>
            <dd className="break-all text-right font-medium text-slate-700">
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
        เก็บไว้ที่ sessionStorage · key: chaochao:bookingDraft
      </p>
    </div>
  );
}
