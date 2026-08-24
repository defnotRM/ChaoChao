"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Landmark,
  QrCode,
  ScanLine,
  Trash2,
  UploadCloud,
} from "lucide-react";

export interface PaymentPageData {
  orderId: string;
  orderNo: string;
  itemName: string;
  startDate: string;
  endDate: string;
  days: number;
  rentalFee: number;
  deposit: number;
  totalPaid: number;
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

function formatDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d)));
}

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

const METHODS = [
  { id: "promptpay", label: "พร้อมเพย์ QR", hint: "แนะนำ · ไม่มีค่าธรรมเนียม", icon: QrCode },
  { id: "bank", label: "โอนผ่านบัญชีธนาคาร", hint: "กสิกรไทย 123-4-56789-0", icon: Landmark },
  { id: "card", label: "บัตรเครดิต/เดบิต", hint: "มีค่าธรรมเนียม +3%", icon: CreditCard },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PaymentClient({ data }: { data: PaymentPageData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<MethodId>("promptpay");
  const [slip, setSlip] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [transferDate, setTransferDate] = useState("");
  const [amount, setAmount] = useState(String(data.totalPaid));
  const [transactionRef, setTransactionRef] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // preview URL สำหรับไฟล์รูป
  useEffect(() => {
    if (slip && slip.type.startsWith("image/")) {
      const url = URL.createObjectURL(slip);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [slip]);

  function acceptFile(file: File | undefined | null) {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setFileError("รองรับเฉพาะไฟล์ JPG, PNG หรือ PDF");
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError("ขนาดไฟล์ต้องไม่เกิน 10 MB");
      return;
    }
    setFileError(null);
    setSlip(file);
  }

  const amountNum = Number(amount);
  const amountMatches = Number.isFinite(amountNum) && amountNum === data.totalPaid;

  const canSubmit =
    Boolean(slip) &&
    transferDate !== "" &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    !submitting &&
    !done;

  async function handleSubmit() {
    if (!canSubmit || !slip) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("slip", slip);
      fd.append("orderId", data.orderId);
      fd.append("amount", String(amountNum));
      fd.append("transferDate", new Date(transferDate).toISOString());
      if (transactionRef.trim()) fd.append("transactionRef", transactionRef.trim());
      fd.append("method", method); // UI-only (ไม่บันทึกลง DB)

      const res = await fetch("/api/payments", { method: "POST", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(payload?.message ?? "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }
      setDone(true);
      // ไปหน้า loading ตรวจสอบการชำระเงิน → แล้วต่อไปหน้ารับของ
      router.push(`/renter/myproductsList/${data.orderId}/payment/verifying`);
    } catch {
      setErrorMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="เส้นทางนำทาง"
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"
        >
          <Link href="/renter/mydashboard" className="transition hover:text-[#1b3554]">
            รายการเช่าของฉัน
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/renter/myproductsList/${data.orderId}`}
            className="transition hover:text-[#1b3554]"
          >
            {data.orderNo}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">ชำระเงิน</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            อัปโหลดสลิปการโอนเงิน
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            เลือกช่องทางการโอน แนบสลิป แล้วยืนยันเพื่อส่งให้ทีมงานตรวจสอบ
          </p>
        </header>

        <Stepper />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
          {/* ───────── คอลัมน์ซ้าย ───────── */}
          <div className="min-w-0 space-y-6">
            {/* ช่องทางการโอน */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <CardHeading icon={<CreditCard className="h-5 w-5" />} title="ช่องทางการโอนเงิน" />
              <div className="space-y-2.5">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const selected = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                        selected
                          ? "border-[#3f6593] bg-sky-50 ring-2 ring-sky-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected ? "bg-[#1b3554] text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900">{m.label}</span>
                        <span className="block text-xs text-slate-500">{m.hint}</span>
                      </span>
                      <span
                        className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                          selected ? "border-[#1b3554] bg-[#1b3554]" : "border-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* กล่อง QR / บัญชี (placeholder) */}
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                {method === "promptpay" ? (
                  <>
                    <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
                      <QrCode className="h-24 w-24 text-slate-300" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      สแกนเพื่อโอน · {thb.format(data.totalPaid)}
                    </p>
                    <p className="text-xs text-slate-500">พร้อมเพย์: บริษัท เช่าเช่า จำกัด</p>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                    >
                      <Download className="h-3.5 w-3.5" />
                      บันทึกรูป QR
                    </button>
                  </>
                ) : method === "bank" ? (
                  <div className="text-left text-sm">
                    <p className="font-bold text-slate-900">ธนาคารกสิกรไทย</p>
                    <p className="mt-1 text-slate-600">เลขบัญชี 123-4-56789-0</p>
                    <p className="text-slate-600">ชื่อบัญชี บริษัท เช่าเช่า จำกัด</p>
                    <p className="mt-2 font-semibold text-[#1b3554]">
                      ยอดโอน {thb.format(data.totalPaid)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    ชำระผ่านบัตรเครดิต/เดบิต — ระบบจะคิดค่าธรรมเนียมเพิ่ม 3%
                    <br />
                    <span className="text-xs text-slate-400">(ตัวอย่าง UI — ยังไม่เปิดใช้งานจริง)</span>
                  </p>
                )}
              </div>
            </section>

            {/* แนบสลิป */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <CardHeading icon={<UploadCloud className="h-5 w-5" />} title="แนบสลิปการโอน" />

              {!slip ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    acceptFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragging
                      ? "border-[#3f6593] bg-sky-50"
                      : "border-slate-300 bg-slate-50 hover:border-[#3f6593] hover:bg-sky-50"
                  }`}
                >
                  <UploadCloud className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    คลิกเพื่อเลือกไฟล์ หรือลากมาวางที่นี่
                  </span>
                  <span className="text-xs text-slate-400">JPG, PNG หรือ PDF · ไม่เกิน 10 MB</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="สลิป" className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-6 w-6 text-slate-400" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{slip.name}</p>
                    <p className="text-xs text-slate-500">{formatSize(slip.size)}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      แนบไฟล์แล้ว
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSlip(null);
                      setFileError(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600 active:scale-95"
                    aria-label="ลบไฟล์"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              {fileError && <p className="mt-2 text-xs font-medium text-rose-600">{fileError}</p>}

              {/* ฟิลด์ข้อมูลการโอน */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="วันเวลาที่โอน" required>
                  <input
                    type="datetime-local"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="ยอดเงินที่โอน (บาท)" required>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="เลขอ้างอิงรายการ (ถ้ามี)">
                    <input
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="เช่น 202608241530XXXX"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* กล่อง OCR (mock) */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <ScanLine className="h-4 w-4" />
                  ข้อมูลที่อ่านจากสลิป (ตัวอย่าง)
                </p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">ยอดเงิน</dt>
                    <dd className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                      {Number.isFinite(amountNum) ? thb.format(amountNum) : "-"}
                      {amountMatches && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">วันเวลา</dt>
                    <dd className="font-semibold text-slate-800">
                      {transferDate ? new Date(transferDate).toLocaleString("th-TH") : "-"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">เลขอ้างอิง</dt>
                    <dd className="font-semibold text-slate-800">{transactionRef || "-"}</dd>
                  </div>
                </dl>
                {!amountMatches && Number.isFinite(amountNum) && amountNum > 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    ยอดที่กรอกไม่ตรงกับยอดที่ต้องชำระ ({thb.format(data.totalPaid)})
                  </p>
                )}
              </div>

              <p className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                ทีมงานจะตรวจสอบสลิปภายในประมาณ 30 นาที
              </p>
            </section>

            {/* Footer ซ้าย */}
            <Link
              href={`/renter/myproductsList/${data.orderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปรายการเช่า
            </Link>
          </div>

          {/* ───────── Sidebar ยอดที่ต้องโอน ───────── */}
          <aside className="lg:sticky lg:top-6">
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{data.orderNo}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  รอชำระเงิน
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-500">ยอดที่ต้องโอน</p>
                <p className="mt-0.5 text-3xl font-extrabold text-[#1b3554]">
                  {thb.format(data.totalPaid)}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{data.itemName}</p>
              </div>

              <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">ค่าเช่า ({data.days} วัน)</dt>
                  <dd className="font-semibold text-slate-800">{thb.format(data.rentalFee)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">เงินประกัน (คืนภายหลัง)</dt>
                  <dd className="font-semibold text-slate-400">{thb.format(data.deposit)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <dt>
                    {formatDate(data.startDate)} – {formatDate(data.endDate)}
                  </dt>
                </div>
              </dl>

              <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                โปรดโอนยอดให้ตรงจนถึงทศนิยม เพื่อให้ระบบตรวจสอบได้อัตโนมัติ
              </p>

              {/* ปุ่มยืนยันอยู่ในการ์ดนี้ (ฝั่งขวา) */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {done ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    ส่งสลิปแล้ว
                  </>
                ) : submitting ? (
                  "กำลังอัปโหลด…"
                ) : (
                  "ยืนยันการชำระเงิน"
                )}
              </button>

              {!canSubmit && !done && (
                <p className="text-center text-xs text-slate-400">
                  แนบสลิป + กรอกวันเวลาและยอดเงินให้ครบก่อนยืนยัน
                </p>
              )}

              {errorMsg && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs font-medium text-rose-700">
                  {errorMsg}
                </p>
              )}

              {done && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-xs font-medium text-emerald-700">
                  อัปโหลดสลิปสำเร็จ กำลังพากลับไปหน้ารายการเช่า…
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── ชิ้นส่วนย่อย ───────────────────────── */

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-[#3f6593] focus:ring-4 focus:ring-sky-100";

function Stepper() {
  const steps = ["เลือกวัน–จุดนัด", "ส่งคำขอ", "ชำระเงิน", "รับของ", "คืนของ"];
  const active = 2;
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[680px] items-center">
        {steps.map((label, index) => {
          const isActive = index === active;
          const isDone = index < active;
          const isLast = index === steps.length - 1;
          return (
            <li key={label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div className="flex shrink-0 items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    isActive
                      ? "bg-[#1b3554] text-white ring-4 ring-[#c0e6fd]/50"
                      : isDone
                        ? "bg-[#1b3554] text-white"
                        : "bg-white text-slate-400 ring-1 ring-slate-200"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-sm ${
                    isActive ? "font-bold text-slate-900" : "font-medium text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <span aria-hidden="true" className="mx-2 h-px flex-1 bg-slate-200 sm:mx-3" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CardHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
        {icon}
      </span>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
