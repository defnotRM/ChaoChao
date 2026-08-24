"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";

interface Category {
  category_id: string;
  category_name: string;
}

interface ItemLocation {
  location_id?: string;
  description?: string | null;
  no?: string | null;
  alley?: string | null;
  road?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
}

interface ItemCondition {
  seq?: number;
  condition?: string | null;
}

interface Availability {
  availability_id?: string;
  start_date: string;
  end_date: string;
}

interface InitialItem {
  item_id: string;
  user_id?: string;
  category_id?: string | null;
  item_name: string;
  description?: string | null;
  original_price?: number | null;
  rental_fee_per_day: number;
  deposit: number;
  status: string;
  itemlocation?: ItemLocation[];
  itemcondition?: ItemCondition[];
  availability?: Availability[];
}

interface EditProductClientProps {
  initialItem: InitialItem;
  categories: Category[];
}

export default function EditProductClient({
  initialItem,
  categories,
}: EditProductClientProps) {
  const router = useRouter();

  // Primary Location prefill
  const primaryLoc = initialItem.itemlocation?.[0];
  const primaryAvail = initialItem.availability?.[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const sixMonthsLaterStr = sixMonthsLater.toISOString().split("T")[0];

  // Form states with initial values
  const [itemName, setItemName] = useState(initialItem.item_name || "");
  const [categoryId, setCategoryId] = useState(
    initialItem.category_id || categories[0]?.category_id || ""
  );
  const [description, setDescription] = useState(initialItem.description || "");
  const [originalPrice, setOriginalPrice] = useState<string>(
    initialItem.original_price ? String(initialItem.original_price) : ""
  );
  const [rentalFeePerDay, setRentalFeePerDay] = useState<string>(
    String(initialItem.rental_fee_per_day || "")
  );
  const [deposit, setDeposit] = useState<string>(
    String(initialItem.deposit !== undefined ? initialItem.deposit : "")
  );
  const [status, setStatus] = useState<string>(initialItem.status || "available");

  // Location
  const [locationDesc, setLocationDesc] = useState(
    primaryLoc?.description || "BTS สยาม / พญาไท (นัดรับที่สถานี)"
  );
  const [province, setProvince] = useState(primaryLoc?.province || "กรุงเทพมหานคร");
  const [district, setDistrict] = useState(primaryLoc?.district || "ปทุมวัน");
  const [subdistrict, setSubdistrict] = useState(primaryLoc?.subdistrict || "ปทุมวัน");

  // Dates
  const [availabilityStart, setAvailabilityStart] = useState(
    primaryAvail?.start_date || todayStr
  );
  const [availabilityEnd, setAvailabilityEnd] = useState(
    primaryAvail?.end_date || sixMonthsLaterStr
  );

  // Conditions
  const initialConditions = (initialItem.itemcondition || [])
    .map((c) => c.condition)
    .filter((c): c is string => Boolean(c && c.trim()));

  const [conditions, setConditions] = useState<string[]>(
    initialConditions.length > 0
      ? initialConditions
      : [
          "ตรวจเช็กสภาพอุปกรณ์และทดสอบการใช้งานร่วมกันก่อนรับมอบ",
          "ห้ามนำอุปกรณ์ไปใช้งานในน้ำ หรือในพื้นที่เสี่ยงอันตราย",
          "ส่งคืนอุปกรณ์ในสภาพสมบูรณ์ตรงตามวันเวลาที่นัดหมาย",
        ]
  );
  const [newCondition, setNewCondition] = useState("");

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleAddCondition() {
    const trimmed = newCondition.trim();
    if (!trimmed) return;
    setConditions([...conditions, trimmed]);
    setNewCondition("");
  }

  function handleRemoveCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!itemName.trim()) {
      setErrorMessage("กรุณากรอกชื่อสินค้า");
      return;
    }
    const fee = Number(rentalFeePerDay);
    if (!fee || fee <= 0) {
      setErrorMessage("กรุณาระบุค่าเช่าต่อวันให้ถูกต้อง");
      return;
    }
    const dep = Number(deposit);
    if (isNaN(dep) || dep < 0) {
      setErrorMessage("กรุณาระบุเงินประกันให้ถูกต้อง");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        categoryId: categoryId || null,
        itemName: itemName.trim(),
        description: description.trim(),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        rentalFeePerDay: fee,
        deposit: dep,
        status,
        locations: [
          {
            description: locationDesc.trim() || "จุดนัดรับที่ตกลงกัน",
            no: "-",
            alley: null,
            road: null,
            subdistrict: subdistrict.trim(),
            district: district.trim(),
            province: province.trim(),
          },
        ],
        availabilityStart,
        availabilityEnd,
        conditions: conditions.filter(Boolean),
      };

      const res = await fetch(`/api/products/${initialItem.item_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      setSuccessMessage("บันทึกการแก้ไขสินค้าเรียบร้อยแล้ว!");
      setTimeout(() => {
        router.push(`/product/${initialItem.item_id}`);
      }, 1200);
    } catch (err: any) {
      console.error("Error updating product:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="เส้นทางนำทาง" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="transition hover:text-[#1b3554]">
          หน้าแรก
        </Link>
        <span>/</span>
        <Link href="/dashboard" className="transition hover:text-[#1b3554]">
          ผู้ให้เช่า
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#1b3554]">แก้ไขข้อมูลอุปกรณ์</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              แก้ไขข้อมูลอุปกรณ์
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            แก้ไขรายละเอียด กำหนดราคา สถานะความพร้อม และเงื่อนไขการให้เช่าอุปกรณ์
          </p>
        </div>
        <Link
          href={`/product/${initialItem.item_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1b3554]"
        >
          <ArrowLeft className="h-4 w-4" />
          ดูหน้ารายละเอียดสินค้า
        </Link>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ข้อมูลสินค้า */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
            <Tag className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">1. ข้อมูลพื้นฐานอุปกรณ์</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่ออุปกรณ์ / สินค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="เช่น Sony Alpha A7 IV พร้อมเลนส์ 24-70mm GM II"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หมวดหมู่สินค้า <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ราคาประเมินอุปกรณ์ (บาท) <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="เช่น 75000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รายละเอียดและคุณสมบัติอุปกรณ์
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุสเปก สภาพการใช้งาน อุปกรณ์เสริมที่มีให้ในเซ็ต (แบตเตอรี่, เมมโมรี่การ์ด, กระเป๋า ฯลฯ)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
        </section>

        {/* Section 2: ราคา, เงินประกัน และสถานะ */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">2. อัตราค่าเช่า เงินประกัน และสถานะ</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ค่าเช่าต่อวัน (บาท / วัน) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={rentalFeePerDay}
                  onChange={(e) => setRentalFeePerDay(e.target.value)}
                  placeholder="เช่น 850"
                  className="w-full rounded-xl border border-slate-200 pl-4 pr-12 py-3 text-sm font-semibold text-slate-900 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="absolute right-4 top-3.5 text-xs font-medium text-slate-400">
                  ฿ / วัน
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เงินประกัน / มัดจำ (บาท) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="เช่น 3000"
                  className="w-full rounded-xl border border-slate-200 pl-4 pr-12 py-3 text-sm font-semibold text-slate-900 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="absolute right-4 top-3.5 text-xs font-medium text-slate-400">
                  ฿
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สถานะสินค้า <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="available">พร้อมให้เช่า (Available)</option>
                <option value="rented">กำลังถูกเช่า (Rented)</option>
                <option value="maintenance">อยู่ระหว่างซ่อมบำรุง (Maintenance)</option>
                <option value="inactive">ปิดประกาศ (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50/70 p-3.5 text-xs text-emerald-800 border border-emerald-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p>
              เงินประกันจะถูกพักไว้ในระบบอย่างปลอดภัย และจะถูกโอนคืนให้ผู้เช่าเมื่อส่งคืนอุปกรณ์เสร็จสมบูรณ์
            </p>
          </div>
        </section>

        {/* Section 3: รูปภาพอุปกรณ์ */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <Camera className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">3. รูปภาพอุปกรณ์</h2>
            </div>
            <span className="text-xs text-slate-400">ภาพตัวอย่างสินค้า</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* กล่องรูปภาพ Placeholder เหมือนในรูป */}
            <div className="relative flex aspect-square w-48 sm:w-56 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-[#eaf0f6] shadow-sm">
              <Package className="h-20 w-20 text-[#a0b5ce]" strokeWidth={1.5} />
            </div>

            {/* กล่องปุ่มเพิ่มรูป (กดแล้วยังไม่มีอะไรเกิดขึ้นตามต้องการ) */}
            <div className="flex flex-1 flex-col justify-center space-y-3 w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-7 text-center transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition group-hover:scale-105">
                  <Plus className="h-5 w-5 text-slate-600" />
                </div>
                <span className="mt-3 text-sm font-semibold text-slate-700">
                  เพิ่มรูปภาพอุปกรณ์
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  รองรับไฟล์ PNG, JPG หรือ WEBP (ขนาดไม่เกิน 5MB)
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: สถานที่นัดรับและวันว่าง */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
            <MapPin className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">4. สถานที่นัดรับและช่วงเวลาให้เช่า</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                จุดนัดรับ–คืนอุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={locationDesc}
                onChange={(e) => setLocationDesc(e.target.value)}
                placeholder="เช่น BTS สยาม / ห้างเซ็นทรัลเวิลด์ / บริเวณอนุสาวรีย์ชัยฯ"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">จังหวัด</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">เขต / อำเภอ</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">แขวง / ตำบล</label>
                <input
                  type="text"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  วันที่เริ่มต้นเปิดให้เช่า <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={availabilityStart}
                  onChange={(e) => setAvailabilityStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  วันที่สิ้นสุดเปิดให้เช่า <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={availabilityEnd}
                  onChange={(e) => setAvailabilityEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: เงื่อนไขการเช่า */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">5. เงื่อนไขและข้อตกลงการเช่า</h2>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {conditions.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{c}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(idx)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="พิมพ์เงื่อนไขเพิ่มเติม เช่น ห้ามนำไปใช้งานในสถานที่เปียกชื้น"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 transition focus:border-[#1b3554] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCondition}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-900"
            >
              <Plus className="h-4 w-4" />
              เพิ่มเงื่อนไข
            </button>
          </div>
        </section>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-sm flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <Link
            href={`/product/${initialItem.item_id}`}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>บันทึกการแก้ไข</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
