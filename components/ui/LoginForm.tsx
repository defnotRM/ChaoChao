"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  loginSchema,
  roleLabels,
  type LoginFormData,
} from "@/lib/validations/login";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "lessee",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
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
        alert(result.message);
        return;
      }

      alert(
        `เข้าสู่ระบบสำเร็จ: ${result.user.username} (${roleLabels[result.user.role as keyof typeof roleLabels]})`
      );

      console.log("Logged in user:", result.user);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* ฝั่งซ้าย: Branding (แสดงผลเฉพาะจอ Desktop lg ขึ้นไป) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#000f22] via-[#3f6593] to-[#1b3554] p-12 text-white lg:flex">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
              <path d="M15 21a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold">ยินดีต้อนรับกลับ</h2>
          <p className="mt-4 text-[#c0e6fd]">
            ระบบจัดการเช่า/ให้เช่า ของอิเล็กทรอนิกส์
          </p>
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

            {/* Role - segmented toggle */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-[#1b3554]">
                ประเภทผู้ใช้งาน
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="lessor"
                    className="peer sr-only"
                    {...register("role")}
                  />
                  <div className="rounded-xl border-2 border-[#c0e6fd] py-3 text-center text-sm font-medium text-[#3f6593] transition hover:border-[#3f6593] peer-checked:border-[#1b3554] peer-checked:bg-[#1b3554] peer-checked:text-white">
                    ผู้เช่า
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="lessee"
                    className="peer sr-only"
                    {...register("role")}
                  />
                  <div className="rounded-xl border-2 border-[#c0e6fd] py-3 text-center text-sm font-medium text-[#3f6593] transition hover:border-[#3f6593] peer-checked:border-[#1b3554] peer-checked:bg-[#1b3554] peer-checked:text-white">
                    ผู้ให้เช่า
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.role.message}
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
