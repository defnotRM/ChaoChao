"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Package,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface PublicUserProfile {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  role: string;
  isLender: boolean;
  isRenter: boolean;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  description: string;
  rentalFeePerDay: number;
  deposit: number;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

function UserProfileContent({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const isFromChat = from === "chat";
  const backHref = isFromChat ? "/chat" : "/users";
  const backLabel = isFromChat ? "กลับไปหน้าแชท" : "กลับไปหน้าค้นหาสมาชิก";

  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [items, setItems] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (!res.ok) {
          setError("ไม่พบข้อมูลผู้ใช้งานนี้");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setItems(data.items || []);
      } catch (err) {
        console.error("Error loading user profile:", err);
        setError("เกิดข้อผิดพลาดในการโหลดโปรไฟล์");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3f6593]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-red-700">
            {error || "ไม่พบผู้ใช้งาน"}
          </h2>
          <p className="mt-2 text-sm text-red-600">
            ผู้ใช้งานนี้อาจไม่มีอยู่ในระบบ หรือถูกระงับการใช้งาน
          </p>
          <button
            onClick={() => router.push(backHref)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1b3554] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#000f22]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </button>
        </div>
      </div>
    );
  }

  const userInitial = user.username ? user.username[0].toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back Link (Dynamic based on where user came from) */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1b3554] transition hover:text-[#3f6593]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{backLabel}</span>
        </Link>

        {/* ========================================================================= */}
        {/* Profile Card Header */}
        {/* ========================================================================= */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md">
          {/* Cover Banner */}
          <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-[#000f22] via-[#1b3554] to-[#3f6593]">
            {user.bannerUrl ? (
              <img
                src={user.bannerUrl}
                alt="Cover Banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#000f22] via-[#1b3554] to-[#3f6593]" />
            )}
          </div>

          {/* Profile Details Bar */}
          <div className="relative px-6 pb-6 pt-2 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              {/* Avatar & Username */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
                <div className="relative -mt-12 sm:-mt-16 flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-2xl sm:text-3xl font-bold text-white shadow-xl ring-4 ring-white">
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

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {user.username}
                    </h1>
                    <span className="rounded-full bg-[#c0e6fd]/30 px-2.5 py-0.5 text-xs font-semibold text-[#1b3554]">
                      {user.role}
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      สมาชิกตั้งแต่{" "}
                      {new Date(user.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Chat Action Button */}
              <div className="flex shrink-0 gap-3">
                <Link
                  href={`/chat?userId=${user.id}`}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>ส่งข้อความ / เริ่มแชท</span>
                </Link>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                เกี่ยวกับผู้ใช้งาน
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {user.bio || "ผู้ใช้งานนี้ยังไม่ได้ระบุรายละเอียดประวัติย่อ"}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Equipment Listings Section (สำหรับผู้ให้เช่า) */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
                <Package className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                อุปกรณ์ที่เปิดให้เช่า ({items.length})
              </h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">
                ยังไม่มีรายการอุปกรณ์ที่เปิดให้เช่าในขณะนี้
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ${
                        item.status === "available"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-500 text-white"
                      }`}
                    >
                      {item.status === "available" ? "พร้อมให้เช่า" : "ไม่พร้อมให้เช่า"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-[#1b3554] transition">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {item.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-xs text-slate-400">ราคาเช่า</span>
                        <p className="text-base font-extrabold text-[#1b3554]">
                          ฿{Number(item.rentalFeePerDay).toLocaleString()}
                          <span className="text-xs font-normal text-slate-500"> / วัน</span>
                        </p>
                      </div>

                      <Link
                        href={`/renter/hireproduct/${item.id}`}
                        className="rounded-xl bg-[#c0e6fd]/30 px-3 py-1.5 text-xs font-semibold text-[#1b3554] transition hover:bg-[#c0e6fd]/70"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3f6593]" />
        </div>
      }
    >
      <UserProfileContent userId={userId} />
    </Suspense>
  );
}
