"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "ค้นหาอุปกรณ์", href: "/listings" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; role?: string } | null>(
    null
  );

  useEffect(() => {
    const supabase = createBrowserClient();

    // Check initial user session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          username:
            user.user_metadata?.username ||
            user.email?.split("@")[0] ||
            "ผู้ใช้งาน",
          role: user.user_metadata?.role,
        });
      } else {
        setUser(null);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          username:
            session.user.user_metadata?.username ||
            session.user.email?.split("@")[0] ||
            "ผู้ใช้งาน",
          role: session.user.user_metadata?.role,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const dashboardLink = "/dashboard";

  const userInitial = user?.username ? user.username[0].toUpperCase() : null;

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

        {/* ปุ่ม Login / Register + Circular Profile Avatar (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {/* แดชบอร์ด Link */}
              <Link
                href={dashboardLink}
                className="flex items-center gap-1.5 rounded-xl bg-[#c0e6fd]/30 px-3.5 py-2 text-sm font-medium text-[#1b3554] transition hover:bg-[#c0e6fd]/60"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>แดชบอร์ด</span>
              </Link>

              {/* ออกจากระบบ Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>ออกจากระบบ</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}

          {/* Circular User Profile Button (Always visible on navbar) */}
          <Link
            href="/profile"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-sm font-bold text-white shadow-md shadow-[#1b3554]/20 ring-2 ring-[#c0e6fd] transition hover:scale-105 hover:ring-[#1b3554] hover:shadow-lg"
            title={user ? `โปรไฟล์ (${user.username})` : "โปรไฟล์ผู้ใช้"}
          >
            {userInitial ? (
              <span>{userInitial}</span>
            ) : (
              <UserIcon className="h-5 w-5 text-white" />
            )}
          </Link>
        </div>

        {/* Mobile Actions: Profile Button + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xs font-bold text-white shadow-sm ring-2 ring-[#c0e6fd]"
            title={user ? `โปรไฟล์ (${user.username})` : "โปรไฟล์ผู้ใช้"}
          >
            {userInitial ? userInitial : <UserIcon className="h-4 w-4 text-white" />}
          </Link>

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-[#1b3554]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
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
              {/* Mobile Profile Link */}
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2.5 text-sm font-medium text-white shadow-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#1b3554]">
                  {userInitial ? userInitial : <UserIcon className="h-3.5 w-3.5" />}
                </div>
                <span>แก้ไขโปรไฟล์ {user ? `(${user.username})` : ""}</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href={dashboardLink}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c0e6fd]/30 px-4 py-2 text-sm font-medium text-[#1b3554]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>แดชบอร์ด</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-1 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
