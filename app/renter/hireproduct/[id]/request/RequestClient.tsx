"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { BookingDraft } from "../booking/types";

export interface RequestPageData {
  item: {
    id: string;
    name: string;
    rentalFeePerDay: number;
    deposit: number;
  };
  ownerName: string;
  renter: {
    firstName: string;
    lastName: string;
    email: string;
    nationalId: string;
    phone: string;
  };
}

const DRAFT_STORAGE_KEY = "chaochao:bookingDraft";

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const longDateFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function toDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function inclusiveDays(startKey: string, endKey: string) {
  const diff = toDate(endKey).getTime() - toDate(startKey).getTime();
  return Math.floor(diff / 86_400_000) + 1;
}

function formatDate(key: string) {
  return longDateFmt.format(toDate(key));
}

/* เกณฑ์หักเงินประกัน 4 ระดับ (สอดคล้องกับ Step 1) */
const DAMAGE_TIERS: Array<{ label: string; from: number; to: number; note?: string }> = [
  { label: "รอยขีดข่วนเล็กน้อย", from: 0.1, to: 0.2 },
  { label: "ชำรุดใช้งานได้บางส่วน", from: 0.3, to: 0.5 },
  { label: "เสียหายหนักต้องซ่อมใหญ่", from: 0.6, to: 0.9 },
  { label: "สูญหาย / ซ่อมไม่ได้", from: 1, to: 1, note: "หักเต็มจำนวน + ชดเชยเพิ่มตามจริง" },
];

export default function RequestClient({ data }: { data: RequestPageData }) {
  const { item, ownerName, renter } = data;
  const router = useRouter();

  // draft จาก Step 1 (undefined = กำลังโหลด, null = ไม่มี)
  const [draft, setDraft] = useState<BookingDraft | null | undefined>(undefined);

  const [firstName, setFirstName] = useState(renter.firstName);
  const [lastName, setLastName] = useState(renter.lastName);
  const [phone, setPhone] = useState(renter.phone);
  const [nationalId, setNationalId] = useState(renter.nationalId);
  const [nationalTouched, setNationalTouched] = useState(false);

  const [acceptTiers, setAcceptTiers] = useState(false);
  const [acceptExceed, setAcceptExceed] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPdpa, setAcceptPdpa] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ orderId: string; warnings: string[] } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      setDraft(raw ? (JSON.parse(raw) as BookingDraft) : null);
    } catch {
      setDraft(null);
    }
  }, []);

  const days =
    draft && draft.start_date && draft.end_date
      ? inclusiveDays(draft.start_date, draft.end_date)
      : 0;

  const deposit = draft?.deposit ?? item.deposit;
  const rentalFee = draft?.rental_fee ?? 0;
  const totalPaid = draft?.total_paid ?? rentalFee + deposit;

  const nationalIdValid = /^\d{13}$/.test(nationalId);
  const canSubmit =
    Boolean(draft) &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    phone.trim() !== "" &&
    nationalIdValid &&
    acceptTiers &&
    acceptExceed &&
    acceptTerms &&
    !submitting &&
    !result;

  async function handleSubmit() {
    if (!canSubmit || !draft) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          startDate: draft.start_date,
          endDate: draft.end_date,
          meetupLocation: draft.meetup_location,
          returnLocation: draft.return_location,
          rentalFee: draft.rental_fee,
          deposit: draft.deposit,
          totalPaid: draft.total_paid,
          renter: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            nationalId: nationalId.trim(),
          },
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(payload?.message ?? "ส่งคำขอไม่สำเร็จ");
        return;
      }
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      setResult({ orderId: payload.orderId, warnings: payload.warnings ?? [] });
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
          <Link href="/renter/hireproduct" className="transition hover:text-[#1b3554]">
            เช่าอุปกรณ์
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/renter/hireproduct/${item.id}/booking`}
            className="transition hover:text-[#1b3554]"
          >
            เลือกวันเช่า
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">ส่งคำขอเช่า</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            ส่งคำขอเช่า
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            ยืนยันข้อมูลผู้เช่าและยอมรับเงื่อนไข ก่อนส่งคำขอเข้าคิวอนุมัติ
          </p>
        </header>

        <Stepper />

        {draft === undefined ? (
          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
            กำลังโหลดข้อมูลคำขอ…
          </div>
        ) : draft === null ? (
          <MissingDraft itemId={item.id} />
        ) : (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-8">
            {/* ───────── คอลัมน์ซ้าย ───────── */}
            <div className="min-w-0 space-y-6">
              {/* ข้อมูลผู้เช่า */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <CardHeading icon={<UserRound className="h-5 w-5" />} title="ข้อมูลผู้เช่า" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="ชื่อ" required>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="ชื่อจริง"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="นามสกุล" required>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="นามสกุล"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="เบอร์โทรศัพท์" required>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                      inputMode="numeric"
                      placeholder="08XXXXXXXX"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="อีเมล">
                    <input
                      value={renter.email}
                      readOnly
                      className={`${inputCls} cursor-not-allowed bg-slate-50 text-slate-500`}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="เลขบัตรประชาชน" required>
                      <input
                        value={nationalId}
                        onChange={(e) =>
                          setNationalId(e.target.value.replace(/[^\d]/g, "").slice(0, 13))
                        }
                        onBlur={() => setNationalTouched(true)}
                        inputMode="numeric"
                        placeholder="เลขบัตร 13 หลัก"
                        aria-invalid={nationalTouched && !nationalIdValid}
                        className={`${inputCls} ${
                          nationalTouched && !nationalIdValid
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : ""
                        }`}
                      />
                      {nationalTouched && !nationalIdValid && (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          เลขบัตรไม่ครบ 13 หลัก
                        </p>
                      )}
                    </Field>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ข้อมูลนี้ใช้ยืนยันตัวตนกับผู้ให้เช่าเท่านั้น และถูกเก็บอย่างปลอดภัย
                </p>
              </section>

              {/* เกณฑ์หักเงินประกัน */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <CardHeading
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="เกณฑ์การหักเงินประกัน"
                  tone="emerald"
                />
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-slate-600">เงินประกันทั้งหมด</span>{" "}
                  <span className="font-bold text-[#1b3554]">{thb.format(deposit)}</span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {DAMAGE_TIERS.map((tier, index) => (
                    <li
                      key={tier.label}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="flex items-start gap-3 text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-700">{tier.label}</span>
                      </span>
                      <span className="shrink-0 text-right font-semibold text-slate-800">
                        {tier.note ? (
                          <>
                            {thb.format(deposit)}
                            <span className="block text-[11px] font-normal text-slate-400">
                              + ชดเชยเพิ่มตามจริง
                            </span>
                          </>
                        ) : (
                          `${thb.format(deposit * tier.from)}–${thb.format(deposit * tier.to)}`
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  กรณีความเสียหายเกินกว่าเงินประกัน ผู้เช่าต้องรับผิดชอบส่วนต่างที่เกินตามจริง
                </p>
              </section>

              {/* ยินยอมเงื่อนไข */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <CardHeading
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="ยอมรับเงื่อนไข"
                />
                <div className="space-y-3">
                  <Consent checked={acceptTiers} onChange={setAcceptTiers} required>
                    รับทราบและยอมรับเกณฑ์การหักเงินประกัน 4 ระดับข้างต้น
                  </Consent>
                  <Consent checked={acceptExceed} onChange={setAcceptExceed} required>
                    กรณีความเสียหายเกินวงเงินประกัน ยินยอมชำระส่วนต่างเพิ่มตามจริง
                  </Consent>
                  <Consent checked={acceptTerms} onChange={setAcceptTerms} required>
                    ยอมรับเงื่อนไขการเช่า และถ่ายรูป/วิดีโอเป็นหลักฐานตอนรับ–คืนอุปกรณ์
                  </Consent>
                  <Consent checked={acceptPdpa} onChange={setAcceptPdpa}>
                    ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคลตามนโยบาย PDPA (ไม่บังคับ)
                  </Consent>
                </div>
              </section>

              {/* ปุ่มท้าย */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "กำลังส่งคำขอ…" : "ส่งคำขอเช่า"}
                </button>
              </div>

              {errorMsg && !result && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMsg}
                </p>
              )}

              {result && <SuccessPanel result={result} itemName={item.name} />}
            </div>

            {/* ───────── Sidebar ตรวจสอบคำขอ ───────── */}
            <aside className="lg:sticky lg:top-6">
              <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-base font-bold text-slate-900">ตรวจสอบคำขอ</h2>

                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Package className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      จำนวน 1 ชิ้น · {days} วัน · ผู้ปล่อยเช่า {ownerName}
                    </p>
                  </div>
                </div>

                <dl className="space-y-2.5 text-sm">
                  <SummaryRow
                    label="ช่วงวันที่เช่า"
                    value={`${formatDate(draft.start_date)} – ${formatDate(draft.end_date)}`}
                  />
                  <SummaryRow
                    label="จุดรับของ"
                    value={draft.meetup_location || "-"}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                  />
                  <SummaryRow
                    label="จุดคืนของ"
                    value={draft.return_location || "-"}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                  />
                </dl>

                <div className="space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                  <SummaryRow label={`ค่าเช่า (${days} วัน)`} value={thb.format(rentalFee)} />
                  <SummaryRow label="เงินประกัน (คืนภายหลัง)" value={thb.format(deposit)} muted />
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-bold text-slate-900">ยอดรวมโดยประมาณ</span>
                    <span className="text-lg font-extrabold text-[#1b3554]">
                      {thb.format(totalPaid)}
                    </span>
                  </div>
                </div>

                <p className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-xs text-[#1b3554]">
                  <Clock3 className="h-4 w-4 shrink-0" />
                  ผู้ให้เช่าจะตรวจและอนุมัติภายในประมาณ 1–3 ชั่วโมง
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── ชิ้นส่วนย่อย ───────────────────────── */

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-[#3f6593] focus:ring-4 focus:ring-sky-100";

function Stepper() {
  const steps = ["เลือกวัน–จุดนัด", "ส่งคำขอ", "ชำระเงิน", "รับของ", "คืนของ"];
  const active = 1;
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

function CardHeading({
  icon,
  title,
  tone = "brand",
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "brand" | "emerald";
}) {
  return (
    <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          tone === "emerald"
            ? "bg-emerald-500/15 text-emerald-700"
            : "bg-[#c0e6fd]/30 text-[#1b3554]"
        }`}
      >
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

function Consent({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3.5 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1b3554] focus:ring-sky-200"
      />
      <span className="text-sm leading-relaxed text-slate-600">
        {children} {required && <span className="text-rose-500">*</span>}
      </span>
    </label>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  icon,
}: {
  label: string;
  value: string;
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-sm text-slate-500">
        {icon}
        {label}
      </dt>
      <dd
        className={`max-w-[60%] text-right text-sm font-semibold ${
          muted ? "text-slate-400" : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function MissingDraft({ itemId }: { itemId: string }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">ยังไม่มีข้อมูลการเลือกวันเช่า</h2>
      <p className="mt-1.5 text-sm text-slate-500">
        กรุณาเลือกช่วงวันและจุดนัดรับ–คืนก่อน แล้วกด “ดำเนินการต่อ” เพื่อมาที่หน้านี้
      </p>
      <Link
        href={`/renter/hireproduct/${itemId}/booking`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปเลือกวันเช่า
      </Link>
    </div>
  );
}

function SuccessPanel({
  result,
  itemName,
}: {
  result: { orderId: string; warnings: string[] };
  itemName: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <h2 className="text-lg font-bold text-slate-900">ส่งคำขอเช่าสำเร็จ</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        คำขอเช่า <span className="font-semibold text-slate-800">{itemName}</span>{" "}
        ถูกส่งเข้าคิวรออนุมัติจากผู้ให้เช่าแล้ว
      </p>
      {result.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {result.warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/renter/myproductsList/${result.orderId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
        >
          ดูรายละเอียดการเช่า
          <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href="/renter/hireproduct"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
        >
          เช่าอุปกรณ์อื่นต่อ
        </Link>
      </div>
    </div>
  );
}
