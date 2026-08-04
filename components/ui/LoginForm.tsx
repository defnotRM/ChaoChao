"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  roleLabels,
  type LoginFormData,
} from "@/lib/validations/login";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "tenant",
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

      // ตัวอย่าง:
      // localStorage.setItem("user", JSON.stringify(result.user));

    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {/* Username */}
      <div>
        <label htmlFor="username">ชื่อผู้ใช้</label>

        <input
          id="username"
          type="text"
          {...register("username")}
        />

        {errors.username && (
          <p>{errors.username.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password">รหัสผ่าน</label>

        <input
          id="password"
          type="password"
          {...register("password")}
        />

        {errors.password && (
          <p>{errors.password.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <p>ประเภทผู้ใช้งาน</p>

        <label>
          <input
            type="radio"
            value="tenant"
            {...register("role")}
          />
          ผู้เช่า
        </label>

        <label>
          <input
            type="radio"
            value="landlord"
            {...register("role")}
          />
          ผู้ให้เช่า
        </label>

        {errors.role && (
          <p>{errors.role.message}</p>
        )}
      </div>

      {/* Submit */}
      <button type="submit">
        เข้าสู่ระบบ
      </button>
    </form>
  );
}