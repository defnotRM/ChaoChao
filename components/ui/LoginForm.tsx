"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Camera,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  loginSchema,
  roleLabels,
  type LoginFormData,
} from "@/lib/validations/login";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      const redirectPath = searchParams.get("redirect") || result.redirectTo || "/";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-state-change"));
      }
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      console.error(error);
      setServerError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* ฝั่งซ้าย: Branding (แสดงผลเฉพาะจอ Desktop lg ขึ้นไป) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#000f22] via-[#0b213f] to-[#1b3554] p-12 text-white lg:flex xl:p-16">
        {/* Background Ambient Glow & Patterns */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#c0e6fd_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        {/* Top: Brand Logo & Tagline */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-[#c0e6fd] text-[#000f22] shadow-lg shadow-sky-400/20">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
              <path d="M15 21a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">CHAO CHAO</span>
            <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#c0e6fd] backdrop-blur-sm">
              PLATFORM
            </span>
          </div>
        </div>

        {/* Middle: Hero Content & Feature Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            <span>แพลตฟอร์มเช่าและให้เช่าอุปกรณ์มืออาชีพ</span>
          </div>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
            ยืมง่าย ปล่อยเช่าคุ้ม <br />
            <span className="bg-gradient-to-r from-sky-300 via-[#c0e6fd] to-teal-200 bg-clip-text text-transparent">
              ปลอดภัยทุกขั้นตอน
            </span>
          </h2>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            ระบบจัดการคำขอเช่าแบบครบวงจร พร้อมระบบพักเงินประกันและบันทึกหลักฐานสภาพของแบบ Realtime
          </p>

          {/* Feature Showcase Cards */}
          <div className="mt-8 space-y-3 max-w-md">
            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition hover:bg-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/20 text-sky-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">เงินมัดจำพักในระบบ ปลอดภัย 100%</h4>
                <p className="text-[11px] text-slate-400">คุ้มครองทั้งผู้เช่าและผู้ให้เช่าจนส่งมอบเสร็จสิ้น</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition hover:bg-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">ตรวจรับ–ส่งคืนด้วยภาพถ่าย</h4>
                <p className="text-[11px] text-slate-400">มีหลักฐานชัดเจน ป้องกันปัญหาความเสียหาย</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition hover:bg-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">อนุมัติและอัปเดตสถานะ Realtime</h4>
                <p className="text-[11px] text-slate-400">เปลี่ยนสถานะคำขอและติดต่อกันได้ทันที</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Trust Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
          <span>© 2026 ChaoChao Inc.</span>
          <span className="flex items-center gap-1.5 text-sky-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ผู้ใช้งานผ่านการยืนยันตัวตน
          </span>
        </div>
      </div>

      {/* ฝั่งขวา: Form */}
      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 p-6 lg:w-1/2 lg:bg-white lg:p-16">
        <div className="w-full max-w-md">
          {/* โลโก้ (แสดงเฉพาะจอมือถือ เพราะจอ Desktop มีฝั่งซ้ายอยู่แล้ว) */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1b3554] lg:hidden">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
                <path d="M15 21a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3" />
              </svg>
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-[#000f22] lg:text-3xl">
                เข้าสู่ระบบ
              </h1>
              <p className="mt-1 text-sm text-[#5b86b6]">
                กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ
              </p>
            </div>
          </div>

          {/* Server Error Banner */}
          {serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm font-medium text-red-600">
                {serverError}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-[#1b3554]"
              >
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                <input
                  id="username"
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้..."
                  {...register("username")}
                  className={`w-full rounded-xl border-2 bg-[#c0e6fd]/10 py-3 pl-10 pr-3 text-sm text-[#000f22] outline-none transition placeholder:text-[#80aad3] focus:ring-2 ${
                    errors.username
                      ? "border-red-500 focus:ring-red-100"
                      : "border-[#c0e6fd] focus:border-[#3f6593] focus:ring-[#c0e6fd]/50"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[#1b3554]"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="รหัสผ่าน"
                  {...register("password")}
                  className={`w-full rounded-xl border-2 bg-[#c0e6fd]/10 py-3 pl-10 pr-11 text-sm text-[#000f22] outline-none transition placeholder:text-[#80aad3] focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-100"
                      : "border-[#c0e6fd] focus:border-[#3f6593] focus:ring-[#c0e6fd]/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b86b6] hover:text-[#1b3554]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>



            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1b3554]/20 transition hover:from-[#1b3554] hover:to-[#000f22] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
