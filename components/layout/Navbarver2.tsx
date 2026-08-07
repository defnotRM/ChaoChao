"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, MessageCircle, Search, X } from "lucide-react";

function Brand() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b3554] shadow-sm">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
          <path d="M15 21a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3" />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-[#000f22]">
        CHAOCHAO
      </span>
    </Link>
  );
}

// ช่องค้นหานี้ใช้ร่วมกันทั้ง Laptop/Desktop และ Tablet/Mobile
function SearchBar({ mobile = false }: { mobile?: boolean }) {
  return (
    <form
      action="/lessee/hireproduct"
      role="search"
      className={mobile ? "w-full" : "mx-8 min-w-0 max-w-2xl flex-1"}
    >
      <label className="relative block">
        <span className="sr-only">ค้นหาอุปกรณ์</span>
        <input
          type="search"
          name="q"
          placeholder="ค้นหาอุปกรณ์ที่ต้องการ"
          className="h-12 w-full rounded-full border border-slate-200 bg-slate-50/70 py-3 pl-5 pr-14 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <button
          type="submit"
          aria-label="ค้นหา"
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#1b3554] transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-sky-600"
        >
          <Search aria-hidden="true" className="h-5 w-5" />
        </button>
      </label>
    </form>
  );
}

export default function Navbarver2() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {/* Laptop/Desktop: แสดงตั้งแต่ breakpoint lg (1024px) ขึ้นไป */}
      <nav className="mx-auto hidden h-20 max-w-7xl items-center px-6 lg:flex lg:px-8">
        <Brand />
        <SearchBar />

        {/* เมนูด้านขวาของ Laptop/Desktop */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/login"
            aria-label="รายการโปรด"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <Heart aria-hidden="true" className="h-6 w-6" />
          </Link>
          <Link
            href="/login"
            aria-label="ข้อความ"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
          </Link>
          <span aria-hidden="true" className="mx-2 h-7 w-px bg-slate-200" />
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#1b3554] transition hover:bg-[#c0e6fd]/30 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#1b3554] hover:to-[#000f22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </nav>

      {/* Tablet/Mobile: แสดงเมื่อหน้าจอเล็กกว่า 1024px */}
      <div className="lg:hidden">
        {/* แถวบนของ Tablet/Mobile */}
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* Hamburger: ปุ่มเปิดและปิดเมนู Tablet/Mobile */}
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            {isOpen ? (
              <X aria-hidden="true" className="h-6 w-6" />
            ) : (
              <Menu aria-hidden="true" className="h-7 w-7" />
            )}
          </button>

          <Brand />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <MessageCircle aria-hidden="true" className="h-6 w-6" />
            </Link>
            <Link
              href="/login"
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <Heart aria-hidden="true" className="h-6 w-6" />
            </Link>
          </div>
        </div>

        {/* ช่องค้นหาแถวล่างของ Tablet/Mobile */}
        <div className="border-t border-slate-100 px-4 pb-3 pt-3 sm:px-6">
          <SearchBar mobile />
        </div>

        {/* เมนู Dropdown ที่แสดงเมื่อกด Hamburger */}
        {isOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg sm:px-6"
          >
            <div className="mx-auto grid max-w-7xl gap-1">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-[#17326b]"
              >
                หน้าแรก
              </Link>
              <Link
                href="/lessee/hireproduct"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-[#17326b]"
              >
                ค้นหาอุปกรณ์
              </Link>
              <div className="my-1 h-px bg-slate-200" />
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-center text-sm font-medium text-[#1b3554] transition hover:bg-[#c0e6fd]/30"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#1b3554] hover:to-[#000f22]"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
