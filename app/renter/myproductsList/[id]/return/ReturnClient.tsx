"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";

export interface ReturnPageData {
  orderId: string;
  itemName: string;
  returnLocation: string | null;
  endDate: string;
  deposit: number;
  status: string;
  ownerName: string;
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

type Photo = { file: File; url: string };

export default function ReturnClient({ data }: { data: ReturnPageData }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const alreadyUploaded = data.renterEvidence !== null;

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const valid: Photo[] = [];
    for (const file of incoming) {
      if (!ALLOWED.includes(file.type)) {
        setErrorMsg("รองรับเฉพาะไฟล์รูป JPG หรือ PNG");
        continue;
      }
      valid.push({ file, url: URL.createObjectURL(file) });
    }
    if (valid.length) {
      setErrorMsg(null);
      setPhotos((prev) => [...prev, ...valid]);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }

  async function handleSubmit() {
    if (photos.length === 0) {
      setErrorMsg("กรุณาแนบรูปหลักฐานอย่างน้อย 1 รูป");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("orderId", data.orderId);
      photos.forEach((p) => fd.append("photos", p.file));
      const res = await fetch("/api/return", { method: "POST", body: fd });
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
          <span className="font-semibold text-[#1b3554]">คืนของ</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">คืนของ</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            อัปโหลดหลักฐานสภาพสินค้า <strong className="text-slate-700">หลังสิ้นสุดการเช่า</strong>{" "}
            ทั้งคุณและผู้ปล่อยเช่าต้องอัปโหลด · ใช้เทียบกับรูปตอนรับของ
          </p>
        </header>

        <Stepper />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
          {/* ───────── คอลัมน์ซ้าย ───────── */}
          <div className="min-w-0 space-y-6">
            {/* นัดหมายคืนของ */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" />
                <h2 className="text-lg font-bold text-slate-900">นัดหมายคืนของ</h2>
                <span className="text-xs text-slate-400">ตกลงกับผู้ปล่อยเช่าแล้ว</span>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs font-semibold text-emerald-700">← คืนของ</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {data.returnLocation || "จุดนัดคืน"}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">{formatDate(data.endDate)}</p>
              </div>
            </section>

            {/* หลักฐานตอนคืนของ */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                    <Camera className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">หลักฐานตอนคืนของ</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    alreadyUploaded ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${alreadyUploaded ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {alreadyUploaded ? "ครบแล้ว" : "รออัปโหลด"}
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-[#3f6593]" />
                <p className="text-xs leading-relaxed text-slate-600">
                  <strong className="text-slate-800">ถ่ายมุมเดียวกับตอนรับของให้ครบ</strong> — ระบบจะนำไปเทียบกับรูปตอนรับของอัตโนมัติ
                  ถ้ามีจุดที่ต่างกันจะช่วยให้แอดมินตัดสินข้อพิพาทได้เร็วขึ้น
                </p>
              </div>

              {alreadyUploaded ? (
                <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-50/60 px-6 py-10 text-center ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">อัปโหลดหลักฐานคืนของแล้ว</p>
                  <p className="text-xs text-slate-500">
                    {data.renterEvidence?.count} รูป · {data.renterEvidence && dateTimeFmt.format(new Date(data.renterEvidence.uploadedAt))}
                  </p>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
                    }}
                    className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                      dragging ? "border-[#3f6593] bg-sky-50" : "border-sky-200 bg-sky-50/40 hover:border-[#3f6593] hover:bg-sky-50"
                    }`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sky-100">
                      <UploadCloud className="h-6 w-6 text-[#3f6593]" />
                    </span>
                    <p className="text-sm font-bold text-slate-800">ลากรูปมาวางที่นี่</p>
                    <p className="text-xs text-slate-500">หรือคลิกเพื่อเลือกไฟล์ · อย่างน้อย 4 รูป (JPG/PNG)</p>
                  </div>

                  {photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {photos.map((p, index) => (
                        <div key={index} className="relative aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={`หลักฐาน ${index + 1}`} className="h-full w-full rounded-2xl object-cover ring-1 ring-slate-200" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow-sm transition hover:bg-white"
                            aria-label="ลบรูป"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {errorMsg && <p className="mt-2 text-xs font-medium text-rose-600">{errorMsg}</p>}

              {/* แถวสถานะ */}
              <UploaderRow
                initials="วช"
                name="คุณ (ผู้เช่า)"
                done={alreadyUploaded}
                subtitle={
                  alreadyUploaded && data.renterEvidence
                    ? `อัปโหลดแล้ว ${data.renterEvidence.count} รูป · ${dateTimeFmt.format(new Date(data.renterEvidence.uploadedAt))}`
                    : photos.length > 0
                      ? `เลือกไว้ ${photos.length} รูป · ยังไม่ได้ส่ง`
                      : "ยังไม่ได้อัปโหลด"
                }
              />
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

              {/* Footer */}
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/renter/myproductsList/${data.orderId}/handover`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  ย้อนไปหน้ารับของ
                </Link>
                {!alreadyUploaded && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={photos.length === 0 || submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                  >
                    {submitting ? "กำลังอัปโหลด…" : `ยืนยันการคืนของ${photos.length > 0 ? ` (${photos.length})` : ""}`}
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
                  {data.status === "item_returned" ? "คืนของแล้ว" : "กำลังเช่า"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">เงินประกัน</span>
                <span className="text-sm font-bold text-slate-900">{thb.format(data.deposit)}</span>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  ครบทั้งสองฝ่ายแล้วจึงจะปิดขั้นตอนนี้ได้
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-800">
                  หลังคืนของ ผู้ปล่อยเช่าจะตรวจสภาพและอาจแจ้งความเสียหายได้ที่หน้าประเมินความเสียหาย
                </p>
                <span className="mt-3 inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1 text-xs font-semibold text-amber-700" title="ยังไม่เปิดใช้งาน">
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
  const active = 4;
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
          done ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-emerald-500" : "bg-amber-500"}`} />
        {done ? "เสร็จแล้ว" : "รออัปโหลด"}
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

// บนหน้าคืนของ: ขั้น "คืนของ" active เสมอเมื่อยังไม่คืน (item_sent)
function returnStep(status: string) {
  if (status === "completed") return 4;
  if (status === "awaiting_additional_payment") return 3;
  if (status === "item_returned") return 3;
  return 2; // item_sent → กำลังคืนของ
}

function StatusTimeline({ data }: { data: ReturnPageData }) {
  const current = returnStep(data.status);
  const eDate = formatDate(data.endDate);
  const hints = [
    "รับอุปกรณ์และอัปโหลดหลักฐานแล้ว",
    `ครบกำหนดคืน ${eDate}`,
    data.renterEvidence
      ? `${dateTimeFmt.format(new Date(data.renterEvidence.uploadedAt))} · คุณอัปโหลดหลักฐานคืนของแล้ว`
      : eDate,
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
