"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export interface HandoverPageData {
  orderId: string;
  itemName: string;
  imageUrl: string | null;
  meetupLocation: string | null;
  returnLocation: string | null;
  startDate: string;
  endDate: string;
  deposit: number;
  status: string;
  ownerName: string;
  ownerId: string;
  renterEvidence: { count: number; uploadedAt: string } | null;
  lenderEvidence: { count: number; uploadedAt: string } | null;
}

const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
// pin timezone ให้ SSR กับ client ตรงกัน (กัน hydration mismatch)
const dateFmt = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const ALLOWED = ["image/jpeg", "image/png"];

function formatDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d)));
}

type Slot = { label: string; file: File | null; url: string | null };

const DEFAULT_LABELS = ["บอดี้หน้า", "บอดี้หลัง", "เลนส์", "มุมล่างซ้าย"];

export default function HandoverClient({ data }: { data: HandoverPageData }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number>(-1);

  const [slots, setSlots] = useState<Slot[]>(
    DEFAULT_LABELS.map((label) => ({ label, file: null, url: null }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const alreadyUploaded = data.renterEvidence !== null;
  const attachedCount = slots.filter((s) => s.file).length;

  function pick(index: number) {
    activeSlotRef.current = index;
    inputRef.current?.click();
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setErrorMsg("รองรับเฉพาะไฟล์รูป JPG หรือ PNG");
      return;
    }
    setErrorMsg(null);
    const i = activeSlotRef.current;
    setSlots((prev) => {
      const next = [...prev];
      if (next[i]?.url) URL.revokeObjectURL(next[i].url!);
      next[i] = { ...next[i], file, url: URL.createObjectURL(file) };
      return next;
    });
  }

  function removeSlot(index: number) {
    setSlots((prev) => {
      const next = [...prev];
      if (next[index]?.url) URL.revokeObjectURL(next[index].url!);
      next[index] = { ...next[index], file: null, url: null };
      return next;
    });
  }

  function addSlot() {
    setSlots((prev) => {
      const next = [...prev, { label: "เพิ่มเติม", file: null, url: null }];
      return next;
    });
    // เปิด picker ให้ช่องใหม่
    setTimeout(() => pick(slots.length), 0);
  }

  async function handleSubmit() {
    const files = slots.filter((s) => s.file).map((s) => s.file!) as File[];
    if (files.length === 0) {
      setErrorMsg("กรุณาแนบรูปหลักฐานอย่างน้อย 1 รูป");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("orderId", data.orderId);
      files.forEach((f) => fd.append("photos", f));
      const res = await fetch("/api/handover", { method: "POST", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(payload?.message ?? "อัปโหลดหลักฐานไม่สำเร็จ");
        return;
      }
      router.refresh();
    } catch {
      setErrorMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/renter/mydashboard" className="transition hover:text-[#1b3554]">
            รายการเช่าของฉัน
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/renter/myproductsList/${data.orderId}`} className="transition hover:text-[#1b3554]">
            รายละเอียดการเช่า
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1b3554]">รับของ</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">รับของ</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            อัปโหลดหลักฐานสภาพสินค้า <strong className="text-slate-700">ก่อนเริ่มเช่า</strong>{" "}
            ทั้งคุณและผู้ปล่อยเช่าต้องอัปโหลด · ใช้เทียบกันหากมีข้อพิพาทตอนคืน
          </p>
        </header>

        <Stepper />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
          {/* ───────── คอลัมน์ซ้าย ───────── */}
          <div className="min-w-0 space-y-6">
            {/* นัดหมายรับของ */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" />
                <h2 className="text-lg font-bold text-slate-900">นัดหมายรับของ</h2>
                <span className="text-xs text-slate-400">ตกลงกับผู้ปล่อยเช่าแล้ว</span>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                <p className="text-xs font-semibold text-[#3f6593]">→ รับของ</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {data.meetupLocation || "จุดนัดรับ"}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">{formatDate(data.startDate)}</p>
              </div>
            </section>

            {/* หลักฐานตอนรับของ */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                    <Camera className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">หลักฐานตอนรับของ</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    alreadyUploaded ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${alreadyUploaded ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {alreadyUploaded ? "ครบแล้ว" : "ยังไม่ครบ"}
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-slate-600">
                  <strong className="text-slate-800">ถ่ายให้ครบก่อนรับของออกจากจุดนัดเสมอ</strong> — อย่างน้อย 4 มุม +
                  จุดที่มีตำหนิเดิมตามที่ระบุในโพสต์ ถ้าไม่มีรูปตอนนี้ จะไม่สามารถอ้างสิทธิ์ได้หากมีข้อพิพาทภายหลัง
                </p>
              </div>

              {/* กริดช่องรูป */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {alreadyUploaded
                  ? DEFAULT_LABELS.map((label) => (
                      <div
                        key={label}
                        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl bg-sky-50/60 text-slate-400 ring-1 ring-sky-100"
                      >
                        <Camera className="h-6 w-6" />
                        <span className="text-[11px] text-slate-500">{label}</span>
                      </div>
                    ))
                  : slots.map((slot, index) => (
                      <div key={index} className="relative aspect-square">
                        {slot.url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slot.url}
                              alt={slot.label}
                              className="h-full w-full rounded-2xl object-cover ring-1 ring-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeSlot(index)}
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow-sm transition hover:bg-white"
                              aria-label="ลบรูป"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-md bg-black/45 px-1.5 py-0.5 text-center text-[10px] font-medium text-white">
                              {slot.label}
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => pick(index)}
                            className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-sky-50/60 text-slate-400 ring-1 ring-sky-100 transition hover:bg-sky-100/60 hover:text-[#3f6593]"
                          >
                            <Camera className="h-6 w-6" />
                            <span className="text-[11px]">{slot.label}</span>
                          </button>
                        )}
                      </div>
                    ))}

                {!alreadyUploaded && (
                  <button
                    type="button"
                    onClick={addSlot}
                    className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-[#3f6593] hover:text-[#3f6593]"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-[11px]">เพิ่มรูป</span>
                  </button>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={onFileChosen}
              />
              {errorMsg && <p className="mt-2 text-xs font-medium text-rose-600">{errorMsg}</p>}

              {/* แถวสถานะผู้เช่า */}
              <UploaderRow
                initials="วช"
                name="คุณ (ผู้เช่า)"
                done={alreadyUploaded}
                subtitle={
                  alreadyUploaded && data.renterEvidence
                    ? `อัปโหลดแล้ว ${data.renterEvidence.count} รูป · ${dateTimeFmt.format(new Date(data.renterEvidence.uploadedAt))}`
                    : attachedCount > 0
                      ? `เลือกไว้ ${attachedCount} รูป · ยังไม่ได้ส่ง`
                      : "ยังไม่ได้อัปโหลด"
                }
              />

              {/* แถวสถานะผู้ปล่อยเช่า (อ่านจาก DB จริง) */}
              <UploaderRow
                initials={data.ownerName.slice(0, 2)}
                name={`${data.ownerName} (ผู้ปล่อยเช่า)`}
                done={data.lenderEvidence !== null}
                subtitle={
                  data.lenderEvidence
                    ? `อัปโหลดแล้ว ${data.lenderEvidence.count} รูป · ${dateTimeFmt.format(new Date(data.lenderEvidence.uploadedAt))}`
                    : "รอผู้ปล่อยเช่าอัปโหลด"
                }
              />

              {/* ปุ่มยืนยัน (เฉพาะยังไม่อัปโหลด) */}
              {!alreadyUploaded && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={attachedCount === 0 || submitting}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                >
                  <Camera className="h-4 w-4" />
                  {submitting ? "กำลังอัปโหลด…" : `ยืนยันรับของ / อัปโหลดหลักฐาน (${attachedCount})`}
                </button>
              )}

              {/* Footer */}
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/renter/myproductsList/${data.orderId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  กลับไปรายการเช่า
                </Link>
                {data.status === "item_sent" || data.status === "item_returned" ? (
                  <Link
                    href={`/renter/myproductsList/${data.orderId}/return`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
                  >
                    ไปหน้าคืนของ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="ต้องรับของก่อนจึงจะคืนของได้"
                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400 opacity-70"
                  >
                    ไปหน้าคืนของ
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* ───────── Sidebar สถานะการเช่า ───────── */}
          <aside className="lg:sticky lg:top-6">
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <Clock3 className="h-5 w-5 text-[#1b3554]" />
                <h2 className="text-base font-bold text-slate-900">สถานะการเช่า</h2>
              </div>

              <StatusTimeline data={data} />

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">สถานะรายการเช่า</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  {statusChipLabel(data.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">เงินประกัน</span>
                <span className="text-sm font-bold text-slate-900">{thb.format(data.deposit)}</span>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-[#3f6593]" />
                  เก็บรูปหลักฐานไว้เป็นสิทธิ์ของคุณ
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  หากผู้ปล่อยเช่าแจ้งความเสียหายที่ไม่ตรงกับรูปตอนรับของ ใช้รูปนี้โต้แย้งได้ที่หน้าประเมินความเสียหาย
                </p>
                <span className="mt-3 inline-flex cursor-not-allowed items-center gap-1 text-xs font-semibold text-slate-400" title="ยังไม่เปิดใช้งาน">
                  คืนของ &amp; ประเมินความเสียหาย →
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ───────────── ชิ้นส่วนย่อย ───────────── */

function Stepper() {
  const steps = ["เลือกวัน–จุดนัด", "ส่งคำขอ", "ชำระเงิน", "รับของ", "คืนของ"];
  const active = 3;
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
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? "bg-[#1b3554] text-white ring-4 ring-[#c0e6fd]/50"
                      : isDone
                        ? "bg-[#1b3554] text-white"
                        : "bg-white text-slate-400 ring-1 ring-slate-200"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span className={`whitespace-nowrap text-sm ${isActive ? "font-bold text-slate-900" : "font-medium text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {!isLast && <span aria-hidden="true" className="mx-2 h-px flex-1 bg-slate-200 sm:mx-3" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function UploaderRow({
  initials,
  name,
  subtitle,
  done,
}: {
  initials: string;
  name: string;
  subtitle: string;
  done: boolean;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xs font-bold text-white">
        {initials.toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          done ? "bg-emerald-500/15 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-emerald-500" : "bg-slate-400"}`} />
        {done ? "เสร็จแล้ว" : "รอดำเนินการ"}
      </span>
    </div>
  );
}

const RENTAL_TIMELINE = [
  "รับของแล้ว",
  "กำลังเช่าอยู่",
  "คืนของ + อัปโหลดหลักฐาน",
  "ผู้ปล่อยเช่าตรวจสภาพ & คืนเงินประกัน",
];

function rentalStep(status: string, hasRenterEvidence: boolean) {
  if (status === "completed") return 4;
  if (status === "awaiting_additional_payment") return 3;
  if (status === "item_returned") return 2;
  if (status === "item_sent") return 1;
  if (status === "paid" && hasRenterEvidence) return 1;
  return 0;
}

function StatusTimeline({ data }: { data: HandoverPageData }) {
  const current = rentalStep(data.status, data.renterEvidence !== null);
  const eDate = formatDate(data.endDate);
  const hints = [
    data.renterEvidence
      ? `${dateTimeFmt.format(new Date(data.renterEvidence.uploadedAt))} · คุณอัปโหลดหลักฐานแล้ว`
      : "รออัปโหลดหลักฐานตอนรับของ",
    `ครบกำหนดคืน ${eDate}`,
    eDate,
    "ดูที่หน้าประเมินความเสียหาย",
  ];
  return (
    <ol>
      {RENTAL_TIMELINE.map((label, index) => {
        const done = index < current;
        const active = index === current;
        const isLast = index === RENTAL_TIMELINE.length - 1;
        return (
          <li key={label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-[#1b3554] text-white ring-4 ring-[#c0e6fd]/50"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-400 ring-1 ring-slate-200"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              {!isLast && <span className={`my-0.5 w-0.5 flex-1 ${done ? "bg-emerald-500" : "bg-slate-200"}`} style={{ minHeight: "1.25rem" }} />}
            </div>
            <div className={isLast ? "" : "pb-3"}>
              <p className={`text-sm ${active ? "font-bold text-slate-900" : done ? "font-semibold text-slate-700" : "font-medium text-slate-400"}`}>
                {label}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{hints[index]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function statusChipLabel(status: string) {
  switch (status) {
    case "item_sent":
      return "กำลังเช่า";
    case "item_returned":
      return "คืนของแล้ว";
    case "completed":
      return "เสร็จสมบูรณ์";
    case "awaiting_additional_payment":
      return "รอชำระเพิ่ม";
    case "paid":
      return "รอรับของ";
    default:
      return status;
  }
}
