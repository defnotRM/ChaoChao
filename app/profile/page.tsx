"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [status, setStatus] = useState("Active");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.status === 401) {
          router.push("/login?redirect=/profile");
          return;
        }

        const data = await res.json();
        if (res.ok && data.user) {
          setUsername(data.user.username || "");
          setBio(data.user.bio || "");
          setRoles(data.user.roles || []);
          setStatus(data.user.status || "Active");
        } else {
          setErrorMsg(data.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!username.trim()) {
      setErrorMsg("กรุณากรอกชื่อผู้ใช้");
      return;
    }

    if (username.length < 4 || username.length > 20) {
      setErrorMsg("ชื่อผู้ใช้ต้องมีความยาว 4 - 20 ตัวอักษร");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrorMsg("ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร a-z, A-Z, 0-9 และ _");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setErrorMsg("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
        return;
      }
      if (
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword)
      ) {
        setErrorMsg("รหัสผ่านต้องประกอบด้วยตัวพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim(),
          password: newPassword ? newPassword.trim() : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.message || "ไม่สามารถบันทึกข้อมูลได้");
        return;
      }

      setSuccessMsg("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    renter: "ผู้เช่า",
    lender: "ผู้ให้เช่า",
    admin: "ผู้ดูแลระบบ",
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3f6593] border-t-transparent"></div>
          <p className="text-sm font-medium text-[#3f6593]">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  const initialLetter = username ? username[0].toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3f6593] transition hover:text-[#1b3554]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>

        {/* Header Profile Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#000f22] via-[#1b3554] to-[#3f6593] p-8 text-white shadow-xl shadow-[#1b3554]/10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* Circular Avatar */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#3f6593] to-[#c0e6fd] text-4xl font-bold text-[#000f22] ring-4 ring-white/30 shadow-inner">
              {initialLetter}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {username || "ผู้ใช้งาน"}
              </h1>
              <p className="mt-1 text-sm text-[#c0e6fd]">
                จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ
              </p>

              {/* Roles Badge */}
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md"
                  >
                    <Shield className="h-3 w-3" />
                    {roleLabels[r] || r}
                  </span>
                ))}
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* General Information Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-[#000f22]">
              ข้อมูลทั่วไป
            </h2>
            <p className="mt-1 text-xs text-[#5b86b6]">
              ข้อมูลนี้จะแสดงต่อผู้ใช้งานอื่นในระบบ
            </p>

            <div className="mt-6 space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-sm font-medium text-[#1b3554]"
                >
                  ชื่อผู้ใช้ (Username)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="กรอกชื่อผู้ใช้..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label
                  htmlFor="bio"
                  className="mb-1.5 block text-sm font-medium text-[#1b3554]"
                >
                  ประวัติย่อ / รายละเอียดเกี่ยวกับตัวคุณ (Bio)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5b86b6]" />
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="เขียนแนะนำตัวสั้น ๆ เช่น ประสบการณ์ อุปกรณ์ที่สนใจ..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-400">
                  {bio.length} / 500 ตัวอักษร
                </p>
              </div>
            </div>
          </div>

          {/* Security / Password Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-[#000f22]">
              ความปลอดภัยและรหัสผ่าน
            </h2>
            <p className="mt-1 text-xs text-[#5b86b6]">
              เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน
            </p>

            <div className="mt-6 space-y-5">
              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-sm font-medium text-[#1b3554]"
                >
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร (A-Z, a-z, 0-9)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b86b6] transition hover:text-[#1b3554]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {newPassword && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-medium text-[#1b3554]"
                  >
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#1b3554] hover:to-[#000f22] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
