"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type DateRangeCalendarProps = {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
};

const weekDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatSelectedDate(value: string) {
  const date = fromIsoDate(value);
  return date
    ? new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }).format(date)
    : "";
}

export default function DateRangeCalendar({
  startDate,
  endDate,
  onChange,
}: DateRangeCalendarProps) {
  const today = useMemo(() => toIsoDate(new Date()), []);
  const initialMonth = fromIsoDate(startDate) ?? fromIsoDate(today)!;
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1, 12),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const days = useMemo(() => {
    const firstDay = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
      12,
    );
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);
      return {
        date,
        iso: toIsoDate(date),
        isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      };
    });
  }, [visibleMonth]);

  const selectionLabel = startDate
    ? endDate
      ? `${formatSelectedDate(startDate)} – ${formatSelectedDate(endDate)}`
      : `${formatSelectedDate(startDate)} – เลือกวันคืน`
    : "เลือกวันที่เริ่มและวันคืน";

  function selectDate(date: string) {
    if (date < today) return;

    if (!startDate || endDate) {
      onChange({ startDate: date, endDate: "" });
      return;
    }

    if (date < startDate) {
      onChange({ startDate: date, endDate: "" });
      return;
    }

    onChange({ startDate, endDate: date });
    setIsOpen(false);
  }

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }

  function clearRange() {
    onChange({ startDate: "", endDate: "" });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-left text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
        >
          <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-600" />
          <span className={`min-w-0 flex-1 ${startDate ? "font-medium" : "text-slate-400"}`}>
            {selectionLabel}
          </span>
        </button>
        {startDate && (
          <button
            type="button"
            aria-label="ล้างช่วงวันที่"
            onClick={clearRange}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="เลือกช่วงวันที่เช่า"
          className="absolute left-0 top-full z-30 mt-2 w-full min-w-[14rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="เดือนก่อนหน้า"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-[#1b3554]">
              {new Intl.DateTimeFormat("th-TH", {
                month: "long",
                year: "numeric",
              }).format(visibleMonth)}
            </p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="เดือนถัดไป"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center" aria-hidden="true">
            {weekDays.map((day) => (
              <span key={day} className="py-1 text-[10px] font-medium text-slate-400">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map(({ date, iso, isCurrentMonth }) => {
              const isDisabled = iso < today;
              const isStart = iso === startDate;
              const isEnd = iso === endDate;
              const isInRange = Boolean(
                startDate && endDate && iso > startDate && iso < endDate,
              );

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    selectDate(iso);
                    if (!isCurrentMonth) {
                      setVisibleMonth(
                        new Date(date.getFullYear(), date.getMonth(), 1, 12),
                      );
                    }
                  }}
                  aria-label={new Intl.DateTimeFormat("th-TH", {
                    dateStyle: "long",
                  }).format(date)}
                  aria-pressed={isStart || isEnd}
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition ${
                    isStart || isEnd
                      ? "bg-[#1b3554] font-semibold text-white shadow-sm"
                      : isInRange
                        ? "bg-sky-100 font-medium text-sky-800"
                        : isDisabled
                          ? "cursor-not-allowed text-slate-200"
                          : isCurrentMonth
                            ? "text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                            : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-2 border-t border-slate-100 pt-2 text-center text-[11px] text-slate-400">
            {!startDate || endDate ? "เลือกวันเริ่มเช่า" : "เลือกวันคืนสินค้า"}
          </p>
        </div>
      )}
    </div>
  );
}
