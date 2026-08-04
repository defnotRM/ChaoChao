"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, roleLabels, type RegisterFormData } from "@/lib/validations/register";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message); // เช่น "username นี้ถูกใช้ไปแล้ว"
      return;
    }

    alert(`ผ่านการตรวจสอบ: ${data.username} (${roleLabels[data.role]})`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="username">ชื่อผู้ใช้</label>
        <input id="username" type="text" {...register("username")} />
        {errors.username && <p>{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor="password">รหัสผ่าน</label>
        <input id="password" type="password" {...register("password")} />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="nationalId">เลขบัตรประชาชน</label>
        <input
          id="nationalId"
          type="text"
          inputMode="numeric"
          maxLength={13}
          {...register("nationalId")}
        />
        {errors.nationalId && <p>{errors.nationalId.message}</p>}
      </div>

      <div>
        <p>ประเภทผู้ใช้งาน</p>
        <label>
          <input type="radio" value="tenant" {...register("role")} />
          ผู้เช่า
        </label>
        <label>
          <input type="radio" value="landlord" {...register("role")} />
          ผู้ให้เช่า
        </label>
        {errors.role && <p>{errors.role.message}</p>}
      </div>

      <button type="submit">สมัครสมาชิก</button>
    </form>
  );
}