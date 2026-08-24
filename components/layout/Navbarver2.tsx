"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Heart,
  Menu,
  MessageCircle,
  Search,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Globe,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

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
      action="/products"
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

interface AuthUser {
  id?: string;
  username: string;
  role?: string;
  avatarUrl?: string | null;
}

export default function Navbarver2() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAuthUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch("/api/chat/rooms", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const totalUnread = (data.rooms || []).reduce(
          (sum: number, r: any) => sum + (r.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch {
      // Ignore
    }
  }, [user]);

  useEffect(() => {
    // 1. Fetch user from server endpoint
    fetchAuthUser();

    // 2. Listen to custom auth events
    const handleAuthChange = () => {
      fetchAuthUser();
    };

    window.addEventListener("auth-state-change", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);

    // 3. Supabase browser client auth listener
    const supabase = createBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchAuthUser();
    });

    return () => {
      window.removeEventListener("auth-state-change", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
      subscription.unsubscribe();
    };
  }, [fetchAuthUser, pathname]);

  useEffect(() => {
    if (user && pathname !== "/chat") {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else if (pathname === "/chat") {
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount, pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      setUser(null);
      setUnreadCount(0);
      window.dispatchEvent(new Event("auth-state-change"));
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const dashboardLink = user?.id ? `/dashboard/${user.id}` : "/dashboard";

  const userInitial = user?.username ? user.username[0].toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {/* Laptop/Desktop: แสดงตั้งแต่ breakpoint lg (1024px) ขึ้นไป */}
      <nav className="mx-auto hidden h-20 max-w-7xl items-center px-6 lg:flex lg:px-8">
        <Brand />
        <SearchBar />

        {/* เมนูด้านขวาของ Laptop/Desktop */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* ปุ่มค้นหาผู้ใช้งาน (Globe Icon) */}
          <Link
            href="/users"
            title="ค้นหาผู้ใช้งาน (Community)"
            aria-label="ค้นหาผู้ใช้งาน"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <Globe aria-hidden="true" className="h-6 w-6" />
          </Link>

          <Link
            href={user ? "/renter/favorites" : "/login?redirect=/renter/favorites"}
            aria-label="รายการโปรด"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <Heart aria-hidden="true" className="h-6 w-6" />
          </Link>

          <Link
            href={user ? "/chat" : "/login?redirect=/chat"}
            aria-label="ข้อความ"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <span aria-hidden="true" className="mx-1 h-7 w-px bg-slate-200" />

          {user ? (
            /* เมื่อผู้ใช้เข้าสู่ระบบ (Logged In) */
            <>
              {/* ปุ่มแดชบอร์ด */}
              <Link
                href={dashboardLink}
                className="flex items-center gap-1.5 rounded-xl bg-[#c0e6fd]/30 px-3.5 py-2 text-sm font-medium text-[#1b3554] transition hover:bg-[#c0e6fd]/60"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>แดชบอร์ด</span>
              </Link>

              {/* ปุ่มโปรไฟล์วงกลมพร้อมรูปโปรไฟล์และชื่อผู้ใช้ */}
              <Link
                href="/profile"
                title="แก้ไขโปรไฟล์"
                className="flex items-center gap-2 rounded-full bg-slate-100/90 py-1 pl-1 pr-3.5 text-sm font-semibold text-[#000f22] ring-1 ring-slate-200/80 transition hover:bg-sky-50 hover:text-[#1b3554] hover:ring-[#3f6593]/40 focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-sm font-bold text-white shadow-sm ring-2 ring-[#c0e6fd]">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <span className="max-w-[120px] truncate">{user.username}</span>
              </Link>

              {/* ปุ่มออกจากระบบ (อยู่ข้างปุ่มโปรไฟล์) */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>ออกจากระบบ</span>
              </button>
            </>
          ) : (
            /* เมื่อผู้ใช้ยังไม่ได้เข้าสู่ระบบ (Logged Out) */
            <>
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
            </>
          )}
        </div>
      </nav>

      {/* Tablet/Mobile: แสดงเมื่อหน้าจอเล็กกว่า 1024px */}
      <div className="lg:hidden">
        {/* แถวบนของ Tablet/Mobile */}
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {/* Hamburger */}
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
            {/* Globe Icon for Mobile */}
            <Link
              href="/users"
              aria-label="ค้นหาผู้ใช้งาน"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <Globe aria-hidden="true" className="h-5 w-5" />
            </Link>

            <Link
              href={user ? "/chat" : "/login?redirect=/chat"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <MessageCircle aria-hidden="true" className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href={user ? "/renter/favorites" : "/login?redirect=/renter/favorites"}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#17326b] transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <Heart aria-hidden="true" className="h-6 w-6" />
            </Link>

            {/* Circular Profile Button for Mobile Top Bar (เฉพาะเมื่อ Logged In) */}
            {user && (
              <Link
                href="/profile"
                aria-label="โปรไฟล์ผู้ใช้งาน"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xs font-bold text-white shadow-sm ring-2 ring-[#c0e6fd]"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </Link>
            )}
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
                href="/products"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-[#17326b]"
              >
                ค้นหาอุปกรณ์
              </Link>
              <Link
                href="/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-[#17326b]"
              >
                <Globe className="h-4 w-4 text-[#17326b]" />
                <span>ค้นหาสมาชิก (Community)</span>
              </Link>
              <Link
                href={user ? "/chat" : "/login?redirect=/chat"}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-[#17326b]"
              >
                <span>กล่องข้อความ</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount} ข้อความใหม่
                  </span>
                )}
              </Link>

              {user ? (
                /* เมื่อเข้าสู่ระบบใน Mobile */
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2.5 text-sm font-medium text-white shadow-sm"
                  >
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-bold text-[#1b3554] ring-2 ring-white/40">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <span>แก้ไขโปรไฟล์ ({user.username})</span>
                  </Link>

                  <div className="my-1 h-px bg-slate-200" />

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={dashboardLink}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c0e6fd]/30 px-4 py-2.5 text-center text-sm font-medium text-[#1b3554]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>แดชบอร์ด</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl border border-red-200 px-4 py-2.5 text-center text-sm font-medium text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </>
              ) : (
                /* เมื่อยังไม่ได้เข้าสู่ระบบใน Mobile */
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
