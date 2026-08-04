"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "ค้นหาอุปกรณ์", href: "/listings" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#c0e6fd] bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* โลโก้ */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1b3554]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
              <path d="M15 21a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#000f22]">ChaoChao</span>
        </Link>

        {/* เมนู (Desktop) */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#3f6593] transition hover:text-[#1b3554]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ปุ่ม Login / Register (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#1b3554] transition hover:bg-[#c0e6fd]/30"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#1b3554] hover:to-[#000f22]"
          >
            สมัครสมาชิก
          </Link>
        </div>

        {/* ปุ่ม Hamburger (Mobile) */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-[#1b3554] md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* เมนู (Mobile) */}
      {isOpen && (
        <div className="border-t border-[#c0e6fd] bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#3f6593] transition hover:bg-[#c0e6fd]/30 hover:text-[#1b3554]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[#c0e6fd] pt-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2 text-center text-sm font-medium text-[#1b3554] transition hover:bg-[#c0e6fd]/30"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] px-4 py-2 text-center text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20"
              >
                สมัครสมาชิก
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
