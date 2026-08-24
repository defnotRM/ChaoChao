"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  QrCode,
  Upload,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import CountdownBanner from "./CountdownBanner";

export interface RentOrderDetailData {
  order: {
    order_id: string;
    item_id: string;
    user_id: string;
    meetup_location: string | null;
    return_location: string | null;
    start_date: string;
    end_date: string;
    rental_fee: number;
    deposit: number;
    total_paid: number;
    status: string;
    created_at: string;
    updated_at: string;
  };
  item: {
    id: string;
    name: string;
    rentalFeePerDay: number;
    deposit: number;
    imageUrl: string | null;
    conditions: string[];
  };
  owner: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    phones?: string[];
    avatarUrl: string | null;
    status: string;
  };
  payments: Array<{
    payment_id: string;
    amount: number;
    status: string;
    slip_image_url?: string | null;
    date?: string;
  }>;
}

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
];

function statusStep(status: string, hasPending: boolean): number {
  switch (status) {
    case "requested":
      return 1; // ส่งคำขอแล้ว (มีเครื่องหมายถูก) ปัจจุบันรอร้านอนุมัติ (ขั้นที่ 2)
    case "awaiting_payment":
      return hasPending ? 3 : 2; // ถ้ามี pending slip อยู่ที่ขั้น 4 "ตรวจการชำระ" ถ้าไม่มีอยู่ที่ขั้น 3 "รอชำระเงิน"
    case "paid":
      return 4;
    case "item_sent":
      return 5;
    case "item_returned":
    case "awaiting_additional_payment":
      return 5;
    case "completed":
      return TIMELINE.length;
    default:
      return -1;
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

export default function RentOrderDetailClient({
  data,
  userId,
}: {
  data: RentOrderDetailData;
  userId: string;
}) {
  const router = useRouter();
  const { order, item, owner } = data;

  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [paymentsList, setPaymentsList] = useState(data.payments);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchLatestOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/rentals/${order.order_id}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (!res.ok) return;
      const json = await res.json();
      const latestOrder = json.data;
      if (!latestOrder) return;

      if (latestOrder.status && latestOrder.status !== currentStatus) {
        setCurrentStatus(latestOrder.status);
        router.refresh();
      }

      if (Array.isArray(latestOrder.payment)) {
        setPaymentsList(latestOrder.payment);
      }
    } catch {
      // ignore
    }
  }, [order.order_id, currentStatus, router]);

  // Realtime subscription + fallback poll
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`renter-order-realtime-${order.order_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rentalorder",
          filter: `order_id=eq.${order.order_id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status) {
            setCurrentStatus((payload.new as any).status);
            router.refresh();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment",
          filter: `order_id=eq.${order.order_id}`,
        },
        () => {
          fetchLatestOrder();
        }
      )
      .subscribe();

    const interval = setInterval(fetchLatestOrder, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [order.order_id, fetchLatestOrder]);

  const hasPending = paymentsList.some((p) => p.status === "pending");
  const paidAmount = paymentsList
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = paymentsList
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const days = inclusiveDays(order.start_date, order.end_date);
  const rentPerDay = Number(item.rentalFeePerDay) || 0;
  const rentalFee = Number(order.rental_fee) || 0;
  const deposit = Number(order.deposit) || 0;
  const totalPaid = Number(order.total_paid) || 0;
  const rentalBase = rentPerDay * days;
  const discount = rentalBase > rentalFee ? rentalBase - rentalFee : 0;

  const step = statusStep(currentStatus, hasPending);
  const isCancelled = step === -1;
  const chip = STATUS_CHIP[currentStatus] ?? { label: currentStatus, cls: "bg-slate-100 text-slate-600" };

  const canPay = currentStatus === "awaiting_payment" && !hasPending;
  const showCountdown = currentStatus === "awaiting_payment" && !hasPending;
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

  const canHandover = currentStatus === "paid" || currentStatus === "item_sent";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmittingSlip(true);
      setErrorMsg(null);

      const payload = {
        orderId: order.order_id,
        amount: totalPaid,
        slipImageUrl: slipPreview || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60",
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErrorMsg(resData.message || "ส่งหลักฐานการชำระเงินไม่สำเร็จ");
        return;
      }

      setPaymentsList([
        ...paymentsList.filter((p) => p.status !== "pending"),
        {
          payment_id: resData.paymentId || "pending-pay",
          amount: totalPaid,
          status: "pending",
          slip_image_url: slipPreview,
        },
      ]);
      setShowPaymentModal(false);
      setSuccessMsg("อัปโหลดสลิปเรียบร้อยแล้ว รอผู้ให้เช่าตรวจสอบการชำระเงิน");
      router.refresh();
    } catch (err) {
      console.error("Payment submit error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmittingSlip(false);
    }
  }

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

        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Countdown banner (กรณีรอชำระเงิน) */}
        {showCountdown && (
          <div className="mb-6">
            <CountdownBanner deadlineISO={deadlineISO} />
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
          {/* ───────────── ฝั่งซ้าย (เนื้อหาหลัก) ───────────── */}
          <div className="min-w-0 space-y-6">
            {/* 1) ไทม์ไลน์สถานะ 6 ขั้น */}
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
                  <ol className="grid min-w-[600px] grid-cols-6 items-start gap-2">
                    {TIMELINE.map((label, index) => {
                      const isDone = index < step;
                      const isCurrent = index === step;

                      let circleCls = "bg-white text-slate-300 ring-1 ring-slate-200";
                      if (isDone) {
                        circleCls = "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30";
                      } else if (isCurrent) {
                        circleCls = "bg-[#1b3554] text-white ring-4 ring-[#c0e6fd]/50 shadow-sm shadow-[#1b3554]/20";
                      }

                      return (
                        <li key={label} className="flex flex-col items-center justify-start text-center">
                          <div className="flex w-full items-center justify-center">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${circleCls}`}
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
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </section>

            {/* 2) ข้อมูลผู้ให้เช่า */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                    <User className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">ข้อมูลผู้ให้เช่า</h2>
                </div>
                <Link
                  href={owner.id ? `/chat?userId=${owner.id}` : "/chat"}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1b3554] transition hover:bg-sky-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>แชทคุยกับผู้ให้เช่า</span>
                </Link>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xl font-bold text-white shadow-sm overflow-hidden">
                  {owner.avatarUrl ? (
                    <img src={owner.avatarUrl} alt={owner.username} className="h-full w-full object-cover" />
                  ) : (
                    <span>{(owner.fullName || owner.username || "L").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={owner.id ? `/user/${owner.id}` : "#"}
                      className="font-bold text-base text-slate-900 transition hover:text-[#1b3554]"
                    >
                      {owner.fullName || owner.username}
                    </Link>
                    <span className="text-xs text-slate-400">(@{owner.username})</span>
                    {owner.status === "Active" && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                        <BadgeCheck className="h-4 w-4" />
                        ยืนยันตัวตน
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    {((owner.phones && owner.phones.length > 0)
                      ? owner.phones
                      : owner.phone
                      ? [owner.phone]
                      : []
                    ).map((ph, idx) => (
                      <a
                        key={idx}
                        href={`tel:${ph}`}
                        className="flex items-center gap-1 hover:text-[#1b3554] transition"
                        title={`โทร ${ph}`}
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ph}</span>
                      </a>
                    ))}
                    {owner.email && (
                      <a
                        href={`mailto:${owner.email}`}
                        className="flex items-center gap-1 hover:text-[#1b3554] transition"
                        title={`ส่งอีเมล ${owner.email}`}
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{owner.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 3) ข้อมูลอุปกรณ์ที่เช่า */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                ข้อมูลอุปกรณ์ที่เช่า
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-28">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
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
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    อัตราค่าเช่าที่ตั้งไว้:{" "}
                    <strong className="text-slate-700">{thb.format(rentPerDay)}</strong> / วัน
                  </p>
                  <p className="text-xs text-slate-500">
                    เงินประกันอุปกรณ์:{" "}
                    <strong className="text-slate-700">{thb.format(deposit)}</strong>
                  </p>
                </div>
              </div>

              {/* ข้อตกลง/เงื่อนไขการเช่า */}
              {item.conditions.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-xs font-bold text-slate-700">เงื่อนไขเฉพาะของอุปกรณ์นี้</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {item.conditions.map((c, i) => (
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

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900">จุดนัดรับอุปกรณ์</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{order.meetup_location || "—"}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.start_date)}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900">จุดนัดคืนอุปกรณ์</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{order.return_location || "—"}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.end_date)}</p>
                </div>
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
                {currentStatus === "requested" ? (
                  <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>ส่งคำขอเช่าแล้ว · รอผู้ให้เช่าอนุมัติ</span>
                    </p>
                  </div>
                ) : currentStatus === "awaiting_payment" ? (
                  canPay ? (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98]"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>ชำระเงิน / อัปโหลดสลิป</span>
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-sky-50 p-4 border border-sky-200">
                      <p className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-sky-600 shrink-0" />
                        <span>อัปโหลดสลิปแล้ว · รอผู้ให้เช่าตรวจสอบ</span>
                      </p>
                    </div>
                  )
                ) : currentStatus === "paid" ? (
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>ชำระเงินเรียบร้อยแล้ว</span>
                    </p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      กรุณารอผู้ให้เช่าตรวจสอบสภาพอุปกรณ์และถ่ายรูปบันทึกหลักฐานก่อนส่งมอบ จากนั้นนัดรับอุปกรณ์ตามวันและจุดนัดหมาย
                    </p>
                  </div>
                ) : currentStatus === "item_sent" || currentStatus === "item_returned" ? (
                  <div className="rounded-2xl bg-sky-50 p-4 border border-sky-200 space-y-1.5">
                    <p className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-sky-600 shrink-0" />
                      <span>กำลังเช่าใช้งานอุปกรณ์</span>
                    </p>
                    <p className="text-xs text-sky-700 leading-relaxed">
                      กำหนดคืนอุปกรณ์ในวันที่ {formatDate(order.end_date)} ที่ {order.return_location || "จุดนัดคืน"} (ผู้ให้เช่าจะทำการตรวจสอบและถ่ายรูปสภาพหลังการใช้งาน)
                    </p>
                  </div>
                ) : currentStatus === "completed" ? (
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>การเช่าเสร็จสมบูรณ์เรียบร้อยแล้ว</span>
                    </p>
                    <p className="text-xs text-emerald-700">ขอบคุณที่ใช้บริการ ChaoChao!</p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700">สถานะ: {chip.label}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal ชำระเงิน / อัปโหลดสลิป */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c0e6fd]/40 text-[#1b3554]">
                <QrCode className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ชำระเงิน &amp; อัปโหลดสลิป</h3>
                <p className="text-xs text-slate-500">ยอดชำระสุทธิ {thb.format(totalPaid)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="mt-4 space-y-4">
              {/* ข้อมูลบัญชีรับเงิน */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-xs space-y-1.5 text-slate-700">
                <p className="font-bold text-[#1b3554] text-sm">บัญชีธนาคารสำหรับโอนเงิน (ChaoChao Escrow)</p>
                <p>ธนาคารกสิกรไทย (KBANK) · บัญชีออมทรัพย์</p>
                <p className="font-mono font-bold text-slate-900 text-sm">123-4-56789-0 (บจก. เชาเชา แพลตฟอร์ม)</p>
                <p className="text-slate-400 text-[11px]">เงินประกันจะถูกพักไว้ที่ระบบอย่างปลอดภัยจนกว่าการเช่าจะเสร็จสมบูรณ์</p>
              </div>

              {/* อัปโหลดสลิป */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  แนบสลิปหลักฐานการโอนเงิน <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center hover:bg-slate-50">
                  {slipPreview ? (
                    <div className="space-y-2">
                      <img src={slipPreview} alt="สลิปโอนเงิน" className="max-h-48 rounded-xl object-contain mx-auto shadow-sm" />
                      <p className="text-xs text-slate-500">{slipFile?.name || "สลิปที่เลือก"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">คลิกเพื่อเลือกรูปภาพสลิป หรือลากไฟล์มาวางที่นี่</p>
                      <p className="text-[11px] text-slate-400">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[#1b3554] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#000f22]"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSlip}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:from-[#000f22] hover:to-[#1b3554] disabled:opacity-50"
                >
                  {isSubmittingSlip ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>ยืนยันการแจ้งชำระเงิน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
