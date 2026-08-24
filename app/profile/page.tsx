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
  ArrowLeft,
  Camera,
  Upload,
  Trash2,
  KeyRound,
  ImageIcon,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [status, setStatus] = useState("Active");

  // Notifications
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile", {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.status === 401) {
          setUsername("ผู้ใช้งานทดลอง (Guest)");
          setBio("ยินดีต้อนรับสู่ระบบ ChaoChao");
          setRoles(["ผู้เช่า (Renter)", "ผู้ให้เช่า (Lender)"]);
          setStatus("Active");
          return;
        }

        const data = await res.json();
        if (res.ok && data.user) {
          setUsername(data.user.username || "");
          setBio(data.user.bio || "");
          setAvatarUrl(data.user.avatarUrl || "");
          setBannerUrl(data.user.bannerUrl || "");
          setRoles(data.user.roles || []);
          setStatus(data.user.status || "Active");

          if (Array.isArray(data.user.phones)) {
            setPhone1(data.user.phones[0] || "");
            setPhone2(data.user.phones[1] || "");
          }
        } else {
          setGeneralError(data.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
        }
      } catch (err) {
        console.error(err);
        setGeneralError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  // Upload Avatar
  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarNotice("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WEBP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarNotice("ขนาดไฟล์ต้องไม่เกิน 5 MB");
      return;
    }

    setAvatarNotice(null);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setAvatarNotice(result.message || "อัปโหลดรูปภาพไม่สำเร็จ");
        return;
      }

      setAvatarUrl(result.avatarUrl);
      setAvatarNotice("อัปโหลดรูปภาพโปรไฟล์สำเร็จ!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-state-change"));
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setAvatarNotice("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    setAvatarNotice(null);
    setUploadingAvatar(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio,
          avatarUrl: "",
        }),
      });

      if (res.ok) {
        setAvatarUrl("");
        setAvatarNotice("ลบรูปโปรไฟล์เรียบร้อยแล้ว");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-state-change"));
        }
        router.refresh();
      } else {
        const result = await res.json();
        setAvatarNotice(result.message || "ไม่สามารถลบรูปโปรไฟล์ได้");
      }
    } catch (err) {
      console.error(err);
      setAvatarNotice("เกิดข้อผิดพลาดในการลบรูปภาพ");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Upload Banner
  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setBannerNotice("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WEBP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerNotice("ขนาดไฟล์ต้องไม่เกิน 5 MB");
      return;
    }

    setBannerNotice(null);
    setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("banner", file);

      const res = await fetch("/api/profile/banner", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setBannerNotice(result.message || "อัปโหลดภาพแบนเนอร์ไม่สำเร็จ");
        return;
      }

      setBannerUrl(result.bannerUrl);
      setBannerNotice("อัปโหลดภาพแบนเนอร์สำเร็จ!");
      router.refresh();
    } catch (err) {
      console.error(err);
      setBannerNotice("เกิดข้อผิดพลาดในการอัปโหลดภาพแบนเนอร์");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Remove Banner
  const handleRemoveBanner = async () => {
    setBannerNotice(null);
    setUploadingBanner(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio,
          bannerUrl: "",
        }),
      });

      if (res.ok) {
        setBannerUrl("");
        setBannerNotice("ลบภาพแบนเนอร์เรียบร้อยแล้ว");
        router.refresh();
      } else {
        const result = await res.json();
        setBannerNotice(result.message || "ไม่สามารถลบภาพแบนเนอร์ได้");
      }
    } catch (err) {
      console.error(err);
      setBannerNotice("เกิดข้อผิดพลาดในการลบภาพแบนเนอร์");
    } finally {
      setUploadingBanner(false);
    }
  };

  // 1. Save ONLY Username, Bio & Phones
  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);

    if (!username.trim()) {
      setGeneralError("กรุณากรอกชื่อผู้ใช้");
      return;
    }

    if (username.length < 4 || username.length > 20) {
      setGeneralError("ชื่อผู้ใช้ต้องมีความยาว 4 - 20 ตัวอักษร");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setGeneralError("ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร a-z, A-Z, 0-9 และ _");
      return;
    }

    const p1 = phone1.trim().replace(/\D/g, "");
    const p2 = phone2.trim().replace(/\D/g, "");

    if (phone1.trim()) {
      if (p1.length !== 10) {
        setGeneralError("เบอร์โทรศัพท์ 1 ต้องมีความยาว 10 หลักพอดี (เฉพาะตัวเลข เช่น 0812345678)");
        return;
      }
    }

    if (phone2.trim()) {
      if (p2.length !== 10) {
        setGeneralError("เบอร์โทรศัพท์ 2 ต้องมีความยาว 10 หลักพอดี (เฉพาะตัวเลข เช่น 0898765432)");
        return;
      }
    }

    const phones = [p1, p2].filter(Boolean);

    setSavingGeneral(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim(),
          phones,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setGeneralError(result.message || "ไม่สามารถบันทึกข้อมูลได้");
        return;
      }

      setGeneralSuccess("บันทึกข้อมูลทั่วไปและเบอร์โทรศัพท์เรียบร้อยแล้ว!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-state-change"));
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setSavingGeneral(false);
    }
  };

  // 2. Save ONLY Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword) {
      setPasswordError("กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setPasswordError("รหัสผ่านต้องประกอบด้วยตัวพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim(),
          password: newPassword.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setPasswordError(result.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
        return;
      }

      setPasswordSuccess("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setPasswordError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setSavingPassword(false);
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
          <p className="text-sm font-medium text-[#3f6593]">
            กำลังโหลดข้อมูลโปรไฟล์...
          </p>
        </div>
      </div>
    );
  }

  const initialLetter = username ? username[0].toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1b3554] transition hover:text-[#3f6593]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับสู่หน้าหลัก</span>
        </Link>

        {/* ========================================================================= */}
        {/* Profile Card Header with Customizable Banner */}
        {/* ========================================================================= */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          {/* Narrow Banner with Upload Button */}
          <div className="group relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-[#000f22] via-[#1b3554] to-[#3f6593]">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Cover Banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#000f22] via-[#1b3554] to-[#3f6593]" />
            )}

            {/* Banner Action Buttons (Top Right) */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <label
                htmlFor="banner-upload-input"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/70 active:scale-95 shadow-sm"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{uploadingBanner ? "กำลังอัปโหลด..." : "เปลี่ยนภาพแบนเนอร์"}</span>
              </label>

              {bannerUrl && (
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  disabled={uploadingBanner}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/80 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-red-700 active:scale-95 shadow-sm disabled:opacity-50"
                  title="ลบภาพแบนเนอร์"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ลบ</span>
                </button>
              )}
            </div>

            <input
              id="banner-upload-input"
              type="file"
              accept="image/*"
              onChange={handleBannerFileChange}
              className="hidden"
            />
          </div>

          {/* Profile Details Bar */}
          <div className="relative px-6 pb-6 pt-2 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              {/* Circular Avatar + Name/Role aligned cleanly */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
                {/* Avatar with Camera Trigger */}
                <div className="group relative -mt-12 sm:-mt-16 flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-2xl sm:text-3xl font-bold text-white shadow-xl ring-4 ring-white">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initialLetter}</span>
                  )}

                  {/* Hover Overlay */}
                  <label
                    htmlFor="avatar-upload-input"
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"
                  >
                    <Camera className="h-5 w-5 text-white" />
                    <span className="mt-0.5 text-[10px] font-medium text-white">
                      เปลี่ยนรูป
                    </span>
                  </label>
                </div>

                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                {/* Name, Roles, Status */}
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {username || "ผู้ใช้งาน"}
                    </h1>
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-[#c0e6fd]/30 px-2.5 py-0.5 text-xs font-semibold text-[#1b3554]"
                      >
                        {roleLabels[r] || r}
                      </span>
                    ))}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    สถานะบัญชี:{" "}
                    <span
                      className={
                        status === "Active"
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Avatar Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <label
                  htmlFor="avatar-upload-input"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                >
                  <Upload className="h-3.5 w-3.5 text-[#3f6593]" />
                  <span>{uploadingAvatar ? "กำลังอัปโหลด..." : "อัปโหลดรูปโปรไฟล์"}</span>
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรูป</span>
                  </button>
                )}
              </div>
            </div>

            {/* Banner / Avatar Notices */}
            {(avatarNotice || bannerNotice) && (
              <div className="mt-4 space-y-2">
                {avatarNotice && (
                  <div className="rounded-xl bg-sky-50 p-2.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                    {avatarNotice}
                  </div>
                )}
                {bannerNotice && (
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200">
                    {bannerNotice}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: General Information (Username, Bio & Phone Numbers) */}
        {/* ========================================================================= */}
        <form
          onSubmit={handleSaveGeneralInfo}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#000f22]">
                ข้อมูลทั่วไป (ชื่อผู้ใช้, ประวัติย่อ และเบอร์โทรศัพท์)
              </h2>
              <p className="mt-0.5 text-xs text-[#5b86b6]">
                แก้ไขชื่อผู้ใช้ ประวัติย่อ และเบอร์โทรติดต่อ โดยไม่ต้องเปลี่ยนรหัสผ่าน
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
              <User className="h-5 w-5" />
            </div>
          </div>

          {/* General Notifications */}
          {generalError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm font-medium">{generalError}</p>
            </div>
          )}

          {generalSuccess && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm font-medium">{generalSuccess}</p>
            </div>
          )}

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

            {/* Phone Numbers (Max 2) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone1"
                  className="mb-1.5 block text-sm font-medium text-[#1b3554]"
                >
                  เบอร์โทรศัพท์ 1 (หลัก)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                  <input
                    id="phone1"
                    type="tel"
                    value={phone1}
                    onChange={(e) =>
                      setPhone1(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="เช่น 0812345678"
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  เบอร์ติดต่อหลัก (ความยาว 10 หลัก)
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone2"
                  className="mb-1.5 block text-sm font-medium text-[#1b3554]"
                >
                  เบอร์โทรศัพท์ 2 (สำรอง - ไม่บังคับ)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b86b6]" />
                  <input
                    id="phone2"
                    type="tel"
                    value={phone2}
                    onChange={(e) =>
                      setPhone2(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="เช่น 0898765432 (ถ้ามี)"
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  เบอร์ติดต่อสำรอง (ความยาว 10 หลัก)
                </p>
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
                  placeholder="เขียนแนะนำตัวสั้น ๆ เช่น ประสบการณ์ อุปกรณ์ที่สนใจ กฎการนัดรับ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                />
              </div>
              <p className="mt-1 text-right text-xs text-slate-400">
                {bio.length} / 500 ตัวอักษร
              </p>
            </div>
          </div>

          {/* Dedicated Save Button for General Info */}
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={savingGeneral}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3f6593] to-[#1b3554] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#1b3554] hover:to-[#000f22] active:scale-95 disabled:opacity-50"
            >
              {savingGeneral ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>บันทึกข้อมูลทั่วไป</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* SECTION 2: Security & Password */}
        {/* ========================================================================= */}
        <form
          onSubmit={handleChangePassword}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#000f22]">
                ความปลอดภัยและรหัสผ่าน
              </h2>
              <p className="mt-0.5 text-xs text-[#5b86b6]">
                เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชีของคุณ
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>

          {/* Password Notifications */}
          {passwordError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm font-medium">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm font-medium">{passwordSuccess}</p>
            </div>
          )}

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
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-[#000f22] outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
                />
              </div>
            </div>
          </div>

          {/* Dedicated Save Button for Password */}
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1b3554] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingPassword ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>กำลังเปลี่ยนรหัสผ่าน...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>บันทึกรหัสผ่านใหม่</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
