"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";

const PHASES = ["ได้รับสลิป", "กำลังตรวจสอบ", "ยืนยันแล้ว"];
const ETA_SECONDS = 8 * 60 + 47; // เวลาที่คาดว่าจะเสร็จ (UI-only)

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function VerifyingClient({
  orderId,
  totalPaid,
}: {
  orderId: string;
  totalPaid: number;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(0); // 0–100
  const [confirmed, setConfirmed] = useState(false);
  const [elapsed, setElapsed] = useState(0); // วินาทีตั้งแต่เปิดหน้า
  const approvedRef = useRef(false);

  const handoverHref = `/renter/myproductsList/${orderId}/handover`;

  // จำลองแอดมินอนุมัติ (ตั้ง payment/order → paid) ครั้งเดียว
  useEffect(() => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    fetch("/api/payments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {
      // เงียบไว้ — เป็น flow ต้นแบบ
    });
  }, [orderId]);

  // เดิน progress bar ~5 วิ แล้วยืนยัน
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const secs = (Date.now() - start) / 1000;
      setElapsed(Math.floor(secs));
      const pct = Math.min(100, Math.round((secs / 5) * 100));
      setProgress(pct);
      if (pct >= 100) {
        setConfirmed(true);
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // ยืนยันแล้ว → ไปหน้ารับของอัตโนมัติ
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => router.push(handoverHref), 1400);
    return () => clearTimeout(t);
  }, [confirmed, handoverHref, router]);

  const remaining = Math.max(0, ETA_SECONDS - elapsed);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-gradient-to-b from-sky-50/60 to-white p-8 text-center shadow-sm sm:p-12">
        {/* ไอคอน */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-100/50">
          {confirmed ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          ) : (
            <Search className="h-9 w-9 text-[#3f6593]" />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
          {confirmed ? "ยืนยันการชำระเงินแล้ว" : "กำลังตรวจสอบการชำระเงิน"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {confirmed
            ? "กำลังพาไปยังขั้นตอนรับของ…"
            : "เราได้รับสลิปของคุณแล้ว ระบบกำลังเทียบกับรายการเดินบัญชี"}
        </p>

        {/* badge */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-100/70 px-4 py-1.5 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {confirmed ? "ตรวจสอบสำเร็จ" : "รอตรวจสอบสลิป"}
          </span>
          <span className="text-amber-700/70">อัปเดตล่าสุด {elapsed} วินาทีที่แล้ว</span>
        </div>

        {/* progress bar */}
        <div className="mx-auto mt-7 max-w-lg">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3f6593] to-[#1b3554] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            {PHASES.map((label, index) => {
              const reached = progress >= (index === 0 ? 1 : index === 1 ? 40 : 100);
              return (
                <span
                  key={label}
                  className={reached ? "font-semibold text-[#1b3554]" : "text-slate-400"}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* eta */}
        <p className="mt-7 text-sm text-slate-500">
          {confirmed ? (
            <span className="font-semibold text-emerald-600">การชำระเงินได้รับการยืนยันแล้ว</span>
          ) : (
            <>
              เวลาที่คาดว่าจะเสร็จ{" "}
              <span className="font-mono text-lg font-extrabold text-[#1b3554]">
                {pad(mm)} : {pad(ss)}
              </span>{" "}
              นาที
            </>
          )}
        </p>

        {confirmed && (
          <button
            type="button"
            onClick={() => router.push(handoverHref)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
          >
            ไปหน้ารับของ
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        <p className="mt-6 text-xs text-slate-400">
          ยอดที่ตรวจสอบ {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(totalPaid)}
        </p>
      </div>
    </div>
  );
}
