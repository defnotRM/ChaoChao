import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  Wallet,
  XCircle,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import CountdownBanner from "./CountdownBanner";

export const dynamic = "force-dynamic";

// UI rule: ต้องชำระเงินภายใน 24 ชม. หลังร้านอนุมัติ (ไม่ผูก schema)
const PAYMENT_WINDOW_HOURS = 24;

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d)));
}
function inclusiveDays(start: string, end: string) {
  const s = new Date(`${start}T00:00:00Z`).getTime();
  const e = new Date(`${end}T00:00:00Z`).getTime();
  return Math.floor((e - s) / 86_400_000) + 1;
}
// เลขที่รายการ UI-only: #RNT-{ปี พ.ศ.}-{6 ตัวแรกของ order_id}
function orderNo(orderId: string, createdAt: string) {
  const be = new Date(createdAt).getFullYear() + 543;
  return `#RNT-${be}-${orderId.slice(0, 6).toUpperCase()}`;
}

const TIMELINE = [
  "ส่งคำขอ",
  "ร้านอนุมัติ",
  "รอชำระเงิน",
  "ตรวจการชำระ",
  "รับของ",
  "คืนของ",
  "ตรวจสภาพ",
  "คืนเงินประกัน",
];

function statusStep(status: string, hasPending: boolean): number {
  switch (status) {
    case "requested":
      return 0;
    case "awaiting_payment":
      return hasPending ? 3 : 2;
    case "paid":
      return 4;
    case "item_sent":
      return 5;
    case "item_returned":
      return 6;
    case "awaiting_additional_payment":
      return 6;
    case "completed":
      return TIMELINE.length; // ครบทุกขั้น
    default:
      return -1; // rejected / cancelled
  }
}

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  requested: { label: "รอการอนุมัติ", cls: "bg-amber-500/15 text-amber-800" },
  awaiting_payment: { label: "รอชำระเงิน", cls: "bg-amber-500/15 text-amber-800" },
  paid: { label: "ชำระเงินแล้ว", cls: "bg-emerald-500/15 text-emerald-700" },
  item_sent: { label: "กำลังเช่า", cls: "bg-sky-500/15 text-sky-700" },
  item_returned: { label: "คืนของแล้ว", cls: "bg-sky-500/15 text-sky-700" },
  awaiting_additional_payment: { label: "รอชำระเพิ่ม", cls: "bg-amber-500/15 text-amber-800" },
  completed: { label: "เสร็จสมบูรณ์", cls: "bg-emerald-500/15 text-emerald-700" },
  rejected: { label: "ถูกปฏิเสธ", cls: "bg-rose-50 text-rose-700" },
  cancelled: { label: "ยกเลิกแล้ว", cls: "bg-rose-50 text-rose-700" },
};

export default async function UserRentalOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>;
}) {
  const { id: userId, orderId } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select(
      "order_id, item_id, user_id, meetup_location, return_location, start_date, end_date, rental_fee, deposit, total_paid, status, created_at, updated_at"
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const [itemRes, imageRes, condRes, paymentsRes] = await Promise.all([
    admin
      .from("item")
      .select("item_name, rental_fee_per_day, deposit, user_id")
      .eq("item_id", order.item_id)
      .maybeSingle(),
    admin
      .from("itemimage")
      .select("image_url, is_primary, sequence")
      .eq("item_id", order.item_id)
      .order("sequence", { ascending: true }),
    admin
      .from("itemcondition")
      .select("seq, condition")
      .eq("item_id", order.item_id)
      .order("seq", { ascending: true }),
    admin
      .from("payment")
      .select("amount, status")
      .eq("order_id", orderId),
  ]);

  const item = itemRes.data;
  const ownerId = item?.user_id ?? "";

  const ownerRes = ownerId
    ? await admin
        .from("useraccount")
        .select("firstname, lastname, username, status")
        .eq("user_id", ownerId)
        .maybeSingle()
    : { data: null };
  const owner = ownerRes.data;
  const ownerName =
    [owner?.firstname, owner?.lastname].filter(Boolean).join(" ").trim() ||
    owner?.username ||
    "ผู้ให้เช่า";

  const primaryImage =
    imageRes.data?.find((i) => i.is_primary)?.image_url ??
    imageRes.data?.[0]?.image_url ??
    null;
  const conditions = (condRes.data || [])
    .map((c) => c.condition)
    .filter((c): c is string => Boolean(c && c.trim()));

  const payments = paymentsRes.data || [];
  const hasPending = payments.some((p) => p.status === "pending");
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const days = inclusiveDays(order.start_date, order.end_date);
  const rentPerDay = Number(item?.rental_fee_per_day) || 0;
  const rentalFee = Number(order.rental_fee) || 0;
  const deposit = Number(order.deposit) || 0;
  const totalPaid = Number(order.total_paid) || 0;
  const rentalBase = rentPerDay * days;
  const discount = rentalBase > rentalFee ? rentalBase - rentalFee : 0;

  const step = statusStep(order.status, hasPending);
  const isCancelled = step === -1;
  const chip = STATUS_CHIP[order.status] ?? { label: order.status, cls: "bg-slate-100 text-slate-600" };

  const canPay = order.status === "awaiting_payment" && !hasPending;
  const showCountdown = order.status === "awaiting_payment" && !hasPending;
  const deadlineISO = new Date(
    new Date(order.updated_at).getTime() + PAYMENT_WINDOW_HOURS * 3_600_000
  ).toISOString();

  const paymentStatusLabel =
    paidAmount >= totalPaid && totalPaid > 0
      ? "ชำระครบแล้ว"
      : hasPending
        ? "รอตรวจสอบสลิป"
        : "ยังไม่ชำระเงิน";
  const paymentShownAmount = paidAmount > 0 ? paidAmount : pendingAmount;

  const canHandover = order.status === "paid" || order.status === "item_sent";

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb + back */}
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-[#1b3554]">
            หน้าแรก
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/dashboard/${userId}`} className="transition hover:text-[#1b3554]">
            แดชบอร์ด
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">รายละเอียดคำสั่งเช่า</span>
        </nav>

        <Link
          href={`/dashboard/${userId}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1b3554]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปแดชบอร์ด
        </Link>

        {/* หัวกระดาษ */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                รายละเอียดคำสั่งเช่า
              </h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${chip.cls}`}>
                {chip.label}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">
              เลขที่รายการ: {orderNo(order.order_id, order.created_at)} · ทำรายการเมื่อ{" "}
              {dateTimeFmt.format(new Date(order.created_at))}
            </p>
          </div>

          <button
            type="button"
            disabled
            title="ฟีเจอร์กำลังพัฒนา"
            className="inline-flex cursor-not-allowed items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-400 opacity-60 shadow-sm sm:self-auto"
          >
            <Printer className="h-4 w-4" />
            พิมพ์ใบสรุปคำสั่งเช่า
          </button>
        </header>

        {/* Countdown banner (กรณีรอชำระเงิน) */}
        {showCountdown && (
          <div className="mb-6">
            <CountdownBanner deadlineISO={deadlineISO} />
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
          {/* ───────────── ฝั่งซ้าย (เนื้อหาหลัก) ───────────── */}
          <div className="min-w-0 space-y-6">
            {/* 1) ไทม์ไลน์สถานะ 8 ขั้น */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                สถานะการเช่าอุปกรณ์
              </h2>

              {isCancelled ? (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>รายการนี้ถูกยกเลิกหรือปฏิเสธแล้ว</span>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <ol className="flex min-w-[620px] items-start">
                    {TIMELINE.map((label, index) => {
                      const isDone = index < step;
                      const isCurrent = index === step;
                      const isLast = index === TIMELINE.length - 1;

                      let circleCls = "bg-white text-slate-300 ring-1 ring-slate-200";
                      if (isDone) {
                        circleCls = "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30";
                      } else if (isCurrent) {
                        circleCls = "bg-[#1b3554] text-white ring-4 ring-[#c0e6fd]/50 shadow-sm shadow-[#1b3554]/20";
                      }

                      return (
                        <li key={label} className={`flex flex-col items-center text-center ${isLast ? "" : "flex-1"}`}>
                          <div className="flex w-full items-center">
                            <span
                              className={`mx-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${circleCls}`}
                            >
                              {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                            </span>
                          </div>
                          <span
                            className={`mt-2 block text-xs ${
                              isCurrent
                                ? "font-bold text-[#1b3554]"
                                : isDone
                                  ? "font-semibold text-slate-700"
                                  : "text-slate-400"
                            }`}
                          >
                            {label}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-tight text-slate-400">
                            {timelineHint(index, order, days)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </section>

            {/* 2) ข้อมูลอุปกรณ์ + ผู้ให้เช่า */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                ข้อมูลอุปกรณ์ที่เช่า
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-28">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={item?.item_name || "รูปสินค้า"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Link
                    href={`/product/${order.item_id}`}
                    className="block text-base font-bold text-slate-900 transition hover:text-[#1b3554]"
                  >
                    {item?.item_name || "—"}
                  </Link>
                  <p className="text-xs text-slate-500">
                    ค่าเช่ารายวัน:{" "}
                    <strong className="text-slate-700">{thb.format(rentPerDay)}</strong> / วัน
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <span className="text-slate-500">ผู้ให้เช่า:</span>
                    <Link
                      href={ownerId ? `/user/${ownerId}` : "#"}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#1b3554] hover:underline"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1b3554] text-[10px] text-white">
                        {ownerName.charAt(0).toUpperCase()}
                      </span>
                      <span>{ownerName}</span>
                      {owner?.status === "Active" && (
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </Link>
                    <Link
                      href="/chat"
                      className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>แชทสอบถาม</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* ข้อตกลง/เงื่อนไขการเช่า */}
              {conditions.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-xs font-bold text-slate-700">เงื่อนไขเฉพาะของอุปกรณ์นี้</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3f6593]" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* 3) รายละเอียดช่วงเวลาและจุดนัด */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                วันและสถานที่นัดหมาย
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c0e6fd]/30 text-[#1b3554]">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900">ระยะเวลาการเช่า</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDate(order.start_date)} — {formatDate(order.end_date)}
                  </p>
                  <p className="text-xs text-slate-500">รวมทั้งหมด {days} วัน</p>
                </div>

                <MeetPoint
                  title="จุดนัดรับอุปกรณ์"
                  place={order.meetup_location}
                  date={formatDate(order.start_date)}
                  tone="emerald"
                />
                <MeetPoint
                  title="จุดนัดคืนอุปกรณ์"
                  place={order.return_location}
                  date={formatDate(order.end_date)}
                  tone="sky"
                />
              </div>
            </section>
          </div>

          {/* ───────────── ฝั่งขวา (สรุปค่าใช้จ่าย & การดำเนินการ) ───────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                สรุปค่าใช้จ่าย
              </h2>
              <dl className="mb-4 space-y-2.5">
                <SummaryRow
                  label={`ค่าเช่า (${days} วัน × ${thb.format(rentPerDay)})`}
                  value={thb.format(rentalBase)}
                />
                {discount > 0 && (
                  <SummaryRow label="ส่วนลดเช่าระยะยาว" value={`−${thb.format(discount)}`} accent />
                )}
                <SummaryRow label="ค่าจัดส่ง" value={thb.format(0)} muted />
                <SummaryRow label="เงินประกัน (คืนภายหลัง)" value={thb.format(deposit)} muted />
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-bold text-slate-900">ยอดสุทธิ</span>
                  <span className="text-lg font-extrabold text-[#1b3554]">
                    {thb.format(totalPaid)}
                  </span>
                </div>
              </dl>

              {/* สถานะการชำระเงิน */}
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">สถานะการชำระเงิน</span>
                  <span
                    className={`text-xs font-bold ${
                      paidAmount >= totalPaid && totalPaid > 0
                        ? "text-emerald-600"
                        : hasPending
                          ? "text-sky-600"
                          : "text-amber-700"
                    }`}
                  >
                    {paymentStatusLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {thb.format(paymentShownAmount)} / {thb.format(totalPaid)}
                </p>
              </div>

              {/* ปุ่มการทำงาน */}
              <div className="mt-4 space-y-2.5">
                {canPay ? (
                  <Link
                    href={`/renter/myproductsList/${order.order_id}/payment`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98]"
                  >
                    <Wallet className="h-4 w-4" />
                    ชำระเงิน / อัปโหลดสลิป
                  </Link>
                ) : (
                  <StubButton primary label="ชำระเงิน / อัปโหลดสลิป" />
                )}
                {canHandover ? (
                  <Link
                    href={`/renter/myproductsList/${order.order_id}/handover`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#3f6593] bg-white px-5 py-3 text-sm font-semibold text-[#1b3554] transition hover:bg-sky-50 active:scale-[0.98]"
                  >
                    <Camera className="h-4 w-4" />
                    รับ–คืนของ / อัปโหลดหลักฐาน
                  </Link>
                ) : (
                  <StubButton label="รับ–คืนของ / อัปโหลดหลักฐาน" />
                )}
                <StubButton label="ยกเลิกรายการเช่า" tone="rose" />
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                ปุ่มที่ยังเป็นสีเทาอยู่ระหว่างพัฒนา
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ข้อความช่วยใต้แต่ละขั้นของไทม์ไลน์ (วันจริง + ข้อความคงที่)
function timelineHint(
  index: number,
  order: {
    created_at: string;
    start_date: string;
    end_date: string;
    meetup_location: string | null;
    return_location: string | null;
  },
  _days: number
) {
  switch (index) {
    case 0:
      return `ส่งคำขอเมื่อ ${dateFmt.format(new Date(order.created_at))}`;
    case 1:
      return "ผู้ให้เช่าตรวจและอนุมัติคำขอ";
    case 2:
      return "โอนเงินและอัปโหลดสลิปภายในเวลาที่กำหนด";
    case 3:
      return "ทีมงานตรวจสอบสลิปการโอน";
    case 4:
      return `${formatDate(order.start_date)} · ${order.meetup_location || "จุดนัดรับ"}`;
    case 5:
      return `${formatDate(order.end_date)} · ${order.return_location || "จุดนัดคืน"}`;
    case 6:
      return "ตรวจสภาพอุปกรณ์หลังคืน";
    case 7:
      return "คืนเงินประกันหากไม่มีความเสียหาย";
    default:
      return "";
  }
}

function MeetPoint({
  title,
  place,
  date,
  tone,
}: {
  title: string;
  place: string | null;
  date: string;
  tone: "emerald" | "sky";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            tone === "emerald" ? "bg-emerald-500/15 text-emerald-700" : "bg-sky-500/15 text-sky-700"
          }`}
        >
          <MapPin className="h-4 w-4" />
        </span>
        <span className="text-sm font-bold text-slate-900">{title}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800">{place || "-"}</p>
      <p className="text-xs text-slate-500">{date}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={`text-sm ${muted ? "text-slate-400" : "text-slate-600"}`}>{label}</dt>
      <dd
        className={`text-sm font-semibold ${accent ? "text-emerald-600" : muted ? "text-slate-400" : "text-slate-800"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function StubButton({
  label,
  primary,
  tone,
}: {
  label: string;
  primary?: boolean;
  tone?: "rose";
}) {
  const base =
    "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold opacity-60";
  const style = primary
    ? "bg-gradient-to-r from-[#1b3554] to-[#3f6593] text-white"
    : tone === "rose"
      ? "border border-rose-200 bg-white text-rose-500"
      : "border border-slate-200 bg-white text-slate-500";
  return (
    <button type="button" disabled title="ฟีเจอร์กำลังพัฒนา" className={`${base} ${style}`}>
      {label}
    </button>
  );
}
