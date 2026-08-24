"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// นับถอยหลังจนถึง deadline (UI-only ไม่แตะ DB) — แสดงเฉพาะออเดอร์ที่ยังรอชำระเงิน
export default function CountdownBanner({ deadlineISO }: { deadlineISO: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(deadlineISO).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadlineISO]);

  // ก่อน mount ปล่อยว่างเพื่อเลี่ยง hydration mismatch
  if (remaining === null) return null;

  const expired = remaining <= 0;

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm text-rose-700">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>
          <strong className="font-semibold">เลยกำหนดชำระเงินแล้ว</strong> — ระบบอาจยกเลิกรายการนี้โดยอัตโนมัติ
        </span>
      </div>
    );
  }

  const totalSec = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
      <span className="inline-flex items-center gap-2">
        <Clock3 className="h-5 w-5 shrink-0 text-amber-600" />
        กรุณาชำระเงินภายในเวลาที่กำหนด มิฉะนั้นรายการจะถูกยกเลิก
      </span>
      <span className="inline-flex items-center gap-1 font-mono text-base font-bold tabular-nums text-amber-900">
        <TimeBox value={pad(hours)} />
        <span>:</span>
        <TimeBox value={pad(minutes)} />
        <span>:</span>
        <TimeBox value={pad(seconds)} />
      </span>
    </div>
  );
}

function TimeBox({ value }: { value: string }) {
  return (
    <span className="rounded-md bg-white/70 px-1.5 py-0.5 ring-1 ring-amber-200">{value}</span>
  );
}
