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

const RENTER_ID = "a2222222-2222-2222-2222-222222222222";

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

export default async function MyProductDetailPage({
  params,
}: PageProps<"/renter/myproductsList/[id]">) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("rentalorder")
    .select(
      "order_id, item_id, user_id, meetup_location, return_location, start_date, end_date, rental_fee, deposit, total_paid, status, created_at, updated_at"
    )
    .eq("order_id", id)
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
      .eq("order_id", id),
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
          <Link href="/renter/mydashboard" className="transition hover:text-[#1b3554]">
            รายการเช่าของฉัน
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">รายละเอียดการเช่า</span>
        </nav>

        <Link
          href="/renter/mydashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1b3554]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการเช่าของฉัน
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                รายการเช่า {orderNo(order.order_id, order.created_at)}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${chip.cls}`}
              >
                {chip.label}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              สร้างเมื่อ {dateTimeFmt.format(new Date(order.created_at))} · อัปเดตล่าสุด{" "}
              {dateTimeFmt.format(new Date(order.updated_at))}
            </p>
          </div>
          <button
            type="button"
            disabled
            title="ฟีเจอร์กำลังพัฒนา"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            พิมพ์ใบเสนอราคา
          </button>
        </div>

        {showCountdown && (
          <div className="mt-5">
            <CountdownBanner deadlineISO={deadlineISO} />
          </div>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ───────── คอลัมน์ซ้าย ───────── */}
          <div className="min-w-0 space-y-6">
            {/* อุปกรณ์ที่เช่า */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={primaryImage} alt={item?.item_name ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-8 w-8" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {item?.item_name ?? "อุปกรณ์เช่า"}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      จองแล้ว
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {thb.format(rentPerDay)}/วัน × {days} วัน · จำนวน 1 ชิ้น
                  </p>
                  {conditions.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {conditions.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-xs text-slate-500">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* ไทม์ไลน์สถานะ */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">สถานะการเช่า</h2>
              </div>

              {isCancelled ? (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  <XCircle className="h-5 w-5 shrink-0" />
                  รายการนี้{chip.label} — ไม่สามารถดำเนินการต่อได้
                </div>
              ) : (
                <ol className="space-y-0">
                  {TIMELINE.map((label, index) => {
                    const done = index < step;
                    const active = index === step;
                    const isLast = index === TIMELINE.length - 1;
                    return (
                      <li key={label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              active
                                ? "bg-[#1b3554] text-white ring-4 ring-[#c0e6fd]/50"
                                : done
                                  ? "bg-[#1b3554] text-white"
                                  : "bg-white text-slate-400 ring-1 ring-slate-200"
                            }`}
                          >
                            {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </span>
                          {!isLast && (
                            <span
                              className={`my-0.5 w-0.5 flex-1 ${done ? "bg-[#1b3554]" : "bg-slate-200"}`}
                              style={{ minHeight: "1.5rem" }}
                            />
                          )}
                        </div>
                        <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                          <p
                            className={`text-sm ${
                              active
                                ? "font-bold text-slate-900"
                                : done
                                  ? "font-semibold text-slate-700"
                                  : "font-medium text-slate-400"
                            }`}
                          >
                            {label}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {timelineHint(index, order, days)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {/* จุดนัดรับ–คืน + ผู้ปล่อยเช่า */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                  <MapPin className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">จุดนัดรับ–คืนอุปกรณ์</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MeetPoint
                  title="รับของ"
                  place={order.meetup_location}
                  date={formatDate(order.start_date)}
                  tone="emerald"
                />
                <MeetPoint
                  title="คืนของ"
                  place={order.return_location}
                  date={formatDate(order.end_date)}
                  tone="sky"
                />
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-base font-bold text-white">
                  {ownerName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-slate-900">{ownerName}</p>
                    {owner?.status === "Active" && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                        <BadgeCheck className="h-4 w-4" />
                        ยืนยันตัวตน
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">ผู้ปล่อยเช่า</p>
                </div>
                <Link
                  href={`/chat?userId=${ownerId}`}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  แชท
                </Link>
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                อย่าลืมถ่ายรูป/วิดีโอสภาพอุปกรณ์ทั้งตอนรับและตอนคืน เพื่อใช้เป็นหลักฐานร่วมกัน
              </p>
            </section>
          </div>

          {/* ───────── Sidebar ยอดชำระ ───────── */}
          <aside className="lg:sticky lg:top-6">
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-bold text-slate-900">สรุปยอดชำระ</h2>

              <dl className="space-y-2.5 text-sm">
                <SummaryRow label={`ค่าเช่าอุปกรณ์ (${days} วัน)`} value={thb.format(rentalBase)} />
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
              <div className="space-y-2.5">
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
                <StubButton label="ดูสถานะการชำระเงิน" />
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
              <p className="text-center text-[11px] text-slate-400">
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
