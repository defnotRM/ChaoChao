"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  MessageCircle,
  Package,
  User,
  Calendar,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

interface PublicUser {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  role: string;
  primaryRole: string;
  itemCount: number;
  createdAt: string;
}

function UsersContent() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<"all" | "lender" | "renter">("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async (query = "", role = "all") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (role !== "all") params.set("role", role);

      const res = await fetch(`/api/users?${params.toString()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchTerm, selectedRole);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole, fetchUsers]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ========================================================================= */}
        {/* Header Hero Banner */}
        {/* ========================================================================= */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#000f22] via-[#1b3554] to-[#3f6593] p-8 text-white shadow-xl sm:p-10">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#c0e6fd] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ChaoChao Community</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              ค้นหาและทำความรู้จักกับสมาชิก
            </h1>
            <p className="mt-2 text-sm text-[#c0e6fd]/90 sm:text-base">
              ค้นหาผู้ให้เช่าอุปกรณ์คุณภาพ หรือผู้เช่าในระบบ ดูโปรไฟล์ และเริ่มพูดคุยสอบถามรายละเอียดได้ทันที
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อผู้ใช้ หรือความสนใจในโปรไฟล์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 pl-11 pr-10 text-sm text-white placeholder-slate-300 outline-none backdrop-blur-md transition focus:border-white focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-4 focus:ring-sky-300/30"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex rounded-2xl bg-white/10 p-1 backdrop-blur-md">
              <button
                onClick={() => setSelectedRole("all")}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  selectedRole === "all"
                    ? "bg-white text-[#1b3554] shadow-sm"
                    : "text-[#c0e6fd] hover:text-white"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setSelectedRole("lender")}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  selectedRole === "lender"
                    ? "bg-white text-[#1b3554] shadow-sm"
                    : "text-[#c0e6fd] hover:text-white"
                }`}
              >
                ผู้ให้เช่า
              </button>
              <button
                onClick={() => setSelectedRole("renter")}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  selectedRole === "renter"
                    ? "bg-white text-[#1b3554] shadow-sm"
                    : "text-[#c0e6fd] hover:text-white"
                }`}
              >
                ผู้เช่า
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* User Cards Grid */}
        {/* ========================================================================= */}
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#3f6593]" />
            <span className="text-sm font-medium">กำลังค้นหาสมาชิก...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">
              ไม่พบสมาชิกที่ตรงกับการค้นหา
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "ทั้งหมด" เพื่อดูสมาชิกทุกคน
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {users.map((u) => {
              const userInitial = u.username ? u.username[0].toUpperCase() : "U";
              const isLenderRole =
                u.primaryRole === "lender" || u.primaryRole === "both";

              return (
                <div
                  key={u.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Top Card Banner */}
                  <div>
                    <div className="relative h-20 w-full overflow-hidden bg-gradient-to-r from-[#1b3554] to-[#3f6593]">
                      {u.bannerUrl ? (
                        <img
                          src={u.bannerUrl}
                          alt={u.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-[#1b3554] to-[#3f6593]" />
                      )}
                    </div>

                    {/* Avatar & Badge */}
                    <div className="relative px-5 pt-0">
                      <div className="-mt-10 flex items-end justify-between">
                        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xl font-bold text-white shadow-md ring-4 ring-white">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{userInitial}</span>
                          )}
                        </div>

                        <span className="rounded-full bg-[#c0e6fd]/30 px-3 py-1 text-xs font-semibold text-[#1b3554]">
                          {u.role}
                        </span>
                      </div>

                      {/* Username & Joined */}
                      <div className="mt-3">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#1b3554] transition">
                          {u.username}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            เข้าร่วมเมื่อ{" "}
                            {new Date(u.createdAt).toLocaleDateString("th-TH", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                      </div>

                      {/* Bio */}
                      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {u.bio || "ยังไม่ได้ระบุประวัติย่อ"}
                      </p>

                      {/* Items Count Badge (if Lender) */}
                      {isLenderRole && (
                        <div className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
                          <Package className="h-3.5 w-3.5 text-[#3f6593]" />
                          <span>
                            {u.itemCount > 0
                              ? `มี ${u.itemCount} อุปกรณ์พร้อมให้เช่า`
                              : "ยังไม่มีรายการอุปกรณ์"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
                    <Link
                      href={`/user/${u.id}?from=users`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>ดูโปรไฟล์</span>
                    </Link>

                    <Link
                      href={`/chat?userId=${u.id}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>แชท</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3f6593]" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
