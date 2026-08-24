"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  CreditCard,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Upload,
  User,
  X,
  XCircle,
} from "lucide-react";

export interface LendOrderData {
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
  };
  renter: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    phones?: string[];
    avatarUrl: string | null;
  };
  payments: Array<{
    payment_id: string;
    amount: number;
    status: string;
    slip_image_url?: string | null;
    date?: string;
  }>;
}

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
      return 1; // อยู่ที่ขั้นที่ 2 "ร้านอนุมัติ" รอผู้ให้เช่ากดอนุมัติ
    case "awaiting_payment":
      return hasPending ? 3 : 2;
    case "paid":
      return 4; // ขั้นที่ 5 "รับของ" รอผู้ให้เช่าถ่ายรูปก่อนให้เช่าและส่งมอบ
    case "item_sent":
    case "item_returned":
    case "awaiting_additional_payment":
      return 5; // ขั้นที่ 6 "คืนของ" รอผู้ให้เช่าตรวจสภาพหลังใช้งาน
    case "completed":
      return TIMELINE.length; // ครบทุกขั้น (6)
    default:
      return -1; // rejected / cancelled
  }
}

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  requested: { label: "คำขอใหม่ รออนุมัติ", cls: "bg-amber-500/15 text-amber-800 border-amber-200" },
  awaiting_payment: { label: "อนุมัติแล้ว รอผู้เช่าชำระเงิน", cls: "bg-sky-500/15 text-sky-800 border-sky-200" },
  paid: { label: "ชำระเงินแล้ว รอนัดส่งมอบ", cls: "bg-emerald-500/15 text-emerald-800 border-emerald-200" },
  item_sent: { label: "ผู้เช่ากำลังใช้งาน", cls: "bg-emerald-500/15 text-emerald-800 border-emerald-200" },
  item_returned: { label: "ส่งคืนแล้ว รอตรวจสภาพ", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  awaiting_additional_payment: { label: "รอชำระเพิ่ม", cls: "bg-amber-500/15 text-amber-800 border-amber-200" },
  completed: { label: "เสร็จสมบูรณ์", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-200" },
  rejected: { label: "ปฏิเสธคำขอแล้ว", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "ผู้เช่ายกเลิกคำขอ", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function LendOrderDetailClient({
  data,
  userId,
}: {
  data: LendOrderData;
  userId: string;
}) {
  const router = useRouter();
  const { order, item, renter, payments } = data;

  const [currentStatus, setCurrentStatus] = useState<string>(order.status);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals for Before & After evidence
  const [showBeforeModal, setShowBeforeModal] = useState<boolean>(false);
  const [showAfterModal, setShowAfterModal] = useState<boolean>(false);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const hasPending = payments.some((p) => p.status === "pending");
  const paidAmount = payments
    .filter((p) => p.status === "paid")
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

  async function handleApprovePayment() {
    try {
      setIsUpdating(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch("/api/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.order_id }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.message || "ไม่สามารถยืนยันการชำระเงินได้");
        return;
      }

      setCurrentStatus("paid");
      setSuccessMsg("ตรวจสอบและยืนยันการชำระเงินเรียบร้อยแล้ว เข้าสู่ขั้นตอนส่งมอบอุปกรณ์");
      router.refresh();
    } catch (err) {
      console.error("Error approving payment:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleUpdateStatus(newStatus: "awaiting_payment" | "rejected") {
    try {
      setIsUpdating(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/rentals/${order.order_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.message || "ไม่สามารถเปลี่ยนสถานะได้");
        return;
      }

      setCurrentStatus(newStatus);
      setSuccessMsg(
        newStatus === "awaiting_payment"
          ? "อนุมัติคำขอเช่าเรียบร้อยแล้ว ระบบได้แจ้งเตือนให้ผู้เช่าชำระเงิน"
          : "ปฏิเสธคำขอเช่าเรียบร้อยแล้ว"
      );
      router.refresh();
    } catch (err) {
      console.error("Error updating order status:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUpdating(false);
    }
  }

  // ส่งมอบอุปกรณ์ & บันทึกสภาพก่อนให้เช่า
  async function handleSubmitBeforeHandover(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsUpdating(true);
      setErrorMsg(null);

      const res = await fetch("/api/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.order_id,
          userId,
          evidenceType: "lender_before",
          imageUrl: beforePreview || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.message || "บันทึกหลักฐานไม่สำเร็จ");
        return;
      }

      setCurrentStatus("item_sent");
      setShowBeforeModal(false);
      setSuccessMsg("บันทึกหลักฐานสภาพก่อนให้เช่าและส่งมอบอุปกรณ์เรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      console.error("Handover submit error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUpdating(false);
    }
  }

  // รับคืนอุปกรณ์ & บันทึกสภาพหลังการใช้งาน
  async function handleSubmitAfterReturn(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsUpdating(true);
      setErrorMsg(null);

      const res = await fetch("/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.order_id,
          userId,
          evidenceType: "lender_after",
          imageUrl: afterPreview || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.message || "บันทึกหลักฐานไม่สำเร็จ");
        return;
      }

      setCurrentStatus("completed");
      setShowAfterModal(false);
      setSuccessMsg("ตรวจสอบสภาพหลังการใช้งานและเสร็จสิ้นการเช่าเรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      console.error("Return submit error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUpdating(false);
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
            แดชบอร์ดผู้ให้เช่า
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">จัดการคำขอเช่า</span>
        </nav>

        <Link
          href={`/dashboard/${userId}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1b3554]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปแดชบอร์ดผู้ให้เช่า
        </Link>

        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                จัดการคำขอเช่าอุปกรณ์
              </h1>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${chip.cls}`}>
                {chip.label}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">
              เลขที่รายการ: {orderNo(order.order_id, order.created_at)} · ส่งคำขอเมื่อ{" "}
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
            พิมพ์ใบคำขอเช่า
          </button>
        </header>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
          {/* ───────────── ฝั่งซ้าย (ข้อมูลคำขอและผู้เช่า) ───────────── */}
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

            {/* 2) ข้อมูลผู้เช่าที่ส่งคำขอเข้ามา */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                    <User className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">ข้อมูลผู้เช่า</h2>
                </div>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1b3554] transition hover:bg-sky-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>แชทคุยกับผู้เช่า</span>
                </Link>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xl font-bold text-white shadow-sm">
                  {renter.avatarUrl ? (
                    <img src={renter.avatarUrl} alt={renter.username} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <span>{renter.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{renter.fullName || renter.username}</h3>
                    <span className="text-xs text-slate-400">(@{renter.username})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    {((renter.phones && renter.phones.length > 0)
                      ? renter.phones
                      : renter.phone
                      ? [renter.phone]
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
                    {renter.email && (
                      <a
                        href={`mailto:${renter.email}`}
                        className="flex items-center gap-1 hover:text-[#1b3554] transition"
                        title={`ส่งอีเมล ${renter.email}`}
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{renter.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 3) ข้อมูลอุปกรณ์ที่ถูกขอเช่า */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                ข้อมูลอุปกรณ์ของคุณ
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
            </section>

            {/* 4) รายละเอียดช่วงเวลาและจุดนัด */}
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

          {/* ───────────── ฝั่งขวา (การตัดสินใจ & สรุปยอดรายได้) ───────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {/* กล่องการกระทำของผู้ให้เช่า */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                การดำเนินการของผู้ให้เช่า
              </h2>

              {currentStatus === "requested" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900">
                      มีคำขอเช่าใหม่ส่งเข้ามา
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      กรุณาตรวจสอบวันและจุดนัดหมาย จากนั้นกดอนุมัติเพื่อให้ผู้เช่าดำเนินการชำระเงิน
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("awaiting_payment")}
                    disabled={isUpdating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition duration-200 hover:from-emerald-700 hover:to-teal-800 active:scale-95 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-4 w-4" />
                    )}
                    <span>อนุมัติการขอเช่า</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={isUpdating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition duration-200 hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>ปฏิเสธคำขอ</span>
                  </button>
                </div>
              ) : currentStatus === "awaiting_payment" ? (
                hasPending ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>ผู้เช่าอัปโหลดสลิปแล้ว (ยอด {thb.format(totalPaid)})</span>
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        กรุณาตรวจสอบยอดเงินในบัญชีธนาคาร จากนั้นกดปุ่มยืนยันการชำระเงิน
                      </p>
                      {payments.find((p) => p.status === "pending")?.slip_image_url && (
                        <div className="mt-2">
                          <a
                            href={payments.find((p) => p.status === "pending")?.slip_image_url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 underline"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>คลิกดูรูปสลิปหลักฐาน</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleApprovePayment}
                      disabled={isUpdating}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition duration-200 hover:from-emerald-700 hover:to-teal-800 active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>ตรวจสอบและยืนยันการชำระเงิน</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-sky-50 p-4 border border-sky-200 space-y-2">
                    <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
                      <Clock className="h-4 w-4 text-sky-600" />
                      <span>อนุมัติแล้ว · รอผู้เช่าชำระเงิน</span>
                    </div>
                    <p className="text-xs text-sky-700">
                      ระบบเปิดให้ผู้เช่าโอนเงินและอัปโหลดสลิปแล้ว เมื่อผู้เช่าโอนแล้วคุณจะสามารถกดตรวจรับการชำระเงินได้ที่นี่
                    </p>
                  </div>
                )
              ) : currentStatus === "paid" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 space-y-1">
                    <p className="text-xs font-bold text-emerald-900">
                      ผู้เช่าชำระเงินเรียบร้อยแล้ว
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      กรุณาถ่ายรูปบันทึกสภาพอุปกรณ์ก่อนส่งมอบ จากนั้นส่งมอบอุปกรณ์ให้ผู้เช่า
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBeforeModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    <span>ถ่ายรูปสภาพก่อนให้เช่า &amp; ส่งมอบ</span>
                  </button>
                </div>
              ) : currentStatus === "item_sent" || currentStatus === "item_returned" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-sky-50 p-4 border border-sky-200 space-y-1">
                    <p className="text-xs font-bold text-sky-900">
                      อุปกรณ์กำลังถูกเช่าใช้งาน
                    </p>
                    <p className="text-[11px] text-sky-700">
                      นัดหมายรับคืนในวันที่ {formatDate(order.end_date)} เมื่อได้รับของคืนแล้ว ให้ถ่ายรูปบันทึกสภาพหลังการใช้งาน
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAfterModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition duration-200 hover:from-emerald-700 hover:to-teal-800 active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    <span>ถ่ายรูปสภาพหลังใช้งาน &amp; เสร็จสิ้นการเช่า</span>
                  </button>
                </div>
              ) : currentStatus === "completed" ? (
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 space-y-1.5">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>การเช่าเสร็จสมบูรณ์เรียบร้อยแล้ว</span>
                  </p>
                  <p className="text-xs text-emerald-700">ตรวจรับอุปกรณ์คืนและบันทึกสภาพเรียบร้อยแล้ว</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">
                    สถานะ: {chip.label}
                  </p>
                </div>
              )}
            </div>

            {/* สรุปค่าใช้จ่าย & รายได้ */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                สรุปค่าเช่าและรายได้
              </h2>
              <dl className="mb-4 space-y-2.5">
                <SummaryRow
                  label={`ค่าเช่า (${days} วัน × ${thb.format(rentPerDay)})`}
                  value={thb.format(rentalBase)}
                />
                {discount > 0 && (
                  <SummaryRow label="ส่วนลดเช่าระยะยาว" value={`−${thb.format(discount)}`} accent />
                )}
                <SummaryRow label="เงินประกัน (พักไว้กับระบบ)" value={thb.format(deposit)} muted />
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-bold text-slate-900">รายได้สุทธิของคุณ</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    +{thb.format(rentalFee)}
                  </span>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal 1: ถ่ายรูปสภาพสินค้าก่อนให้เช่า (Step 5) */}
      {showBeforeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowBeforeModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c0e6fd]/40 text-[#1b3554]">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ถ่ายรูปสภาพอุปกรณ์ก่อนให้เช่า</h3>
                <p className="text-xs text-slate-500">บันทึกเป็นหลักฐานก่อนส่งมอบอุปกรณ์ให้ผู้เช่า</p>
              </div>
            </div>

            <form onSubmit={handleSubmitBeforeHandover} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รูปถ่ายสภาพอุปกรณ์ (ทุกมุม/จุดสำคัญ) <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center hover:bg-slate-50">
                  {beforePreview ? (
                    <div className="space-y-2">
                      <img src={beforePreview} alt="สภาพก่อนให้เช่า" className="max-h-48 rounded-xl object-contain mx-auto shadow-sm" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                      <p className="text-[11px] text-slate-400">แนะนำให้ถ่ายรูปตัวเครื่อง หน้าเลนส์ ปุ่ม และอุปกรณ์เสริม</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setBeforePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[#1b3554] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#000f22]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBeforeModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:from-[#000f22] hover:to-[#1b3554] disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>ยืนยันส่งมอบอุปกรณ์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: ถ่ายรูปสภาพสินค้าหลังการใช้งาน (Step 6) */}
      {showAfterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAfterModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ถ่ายรูปสภาพอุปกรณ์หลังการใช้งาน</h3>
                <p className="text-xs text-slate-500">บันทึกเป็นหลักฐานหลังรับอุปกรณ์คืนและเสร็จสิ้นการเช่า</p>
              </div>
            </div>

            <form onSubmit={handleSubmitAfterReturn} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รูปถ่ายสภาพอุปกรณ์หลังใช้งาน <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center hover:bg-slate-50">
                  {afterPreview ? (
                    <div className="space-y-2">
                      <img src={afterPreview} alt="สภาพหลังใช้งาน" className="max-h-48 rounded-xl object-contain mx-auto shadow-sm" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                      <p className="text-[11px] text-slate-400">ตรวจสอบสภาพ ความสมบูรณ์ และการทำงานของอุปกรณ์</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAfterPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAfterModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>ยืนยันตรวจรับคืน &amp; เสร็จสิ้นการเช่า</span>
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
