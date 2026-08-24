# 🎨 CHAOCHAO Design System & Frontend Development Guidelines

> **System Prompt & Reference Document for AI Assistants (Claude / ChatGPT / Copilot)**  
> ใช้สำหรับสร้าง UI Components, หน้าเว็บใหม่ และการจัดสไตล์ในโปรเจกต์ **CHAOCHAO** เพื่อให้ดีไซน์ โทนสี และสถาปัตยกรรมโค้ดตรงกัน 100%

---

## 📌 1. Project Overview & Tech Stack

- **Project Name**: CHAOCHAO (แพลตฟอร์มเช่าและให้เช่าอุปกรณ์ - Equipment Rental & Lending Platform)
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Icon Library**: `lucide-react`
- **Backend / Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)

---

## 🎨 2. Color Palette & Theme Tokens

### 2.1 Primary Brand Colors (โทนน้ำเงินเข้ม พรีเมียม ทันสมัย)
| Token Name | Hex Code | Tailwind Usage | Purpose |
|---|---|---|---|
| **Primary Navy** | `#1b3554` | `bg-[#1b3554]`, `text-[#1b3554]` | สีหลักของแบรนด์, ปุ่มหลัก, Navbar Logo, หัวข้อสำคัญ |
| **Dark Midnight** | `#000f22` | `bg-[#000f22]`, `hover:from-[#000f22]` | สีเมื่อ Hover ปุ่ม, โทนเงาเข้มของ Cover Banner |
| **Steel Blue Accent** | `#3f6593` | `text-[#3f6593]`, `to-[#3f6593]` | สี Accent, Gradient ปุ่ม, ขอบไฮไลต์, Icon เน้น |
| **Sky Soft / Light** | `#c0e6fd` | `bg-[#c0e6fd]/30`, `text-[#1b3554]` | พื้นหลัง Badge, Tag ผู้ใช้, Focus Ring (`ring-sky-100`) |

### 2.2 Neutral Surface & Backgrounds
| Surface | Tailwind Class | Description |
|---|---|---|
| **Page Background** | `bg-slate-50` หรือ `bg-slate-100/70` | พื้นหลังของทุกหน้าเว็บ สะอาด นุ่มสายตา |
| **Card Surface** | `bg-white` | พื้นหลังของกล่อง Card, Modal, Input |
| **Card Border** | `border border-slate-200/80` | เส้นขอบการ์ดแบบบางคมชัด |
| **Subtle Muted BG** | `bg-slate-100` | พื้นหลังสำหรับปุ่มรอง หรือช่องใส่โค้ด |

### 2.3 Typography & Text Colors
| Role | Tailwind Class | Recommended Style |
|---|---|---|
| **Page Hero / Title** | `text-2xl sm:text-3xl font-extrabold text-slate-900` | หัวข้อใหญ่ประจำหน้า |
| **Section Heading** | `text-lg sm:text-xl font-bold text-slate-900` | หัวข้อส่วนย่อย |
| **Card Title** | `text-base font-bold text-slate-900` | ชื่ออุปกรณ์ / ชื่อผู้ใช้ |
| **Body Content** | `text-sm text-slate-700 leading-relaxed` | เนื้อหารายละเอียด, Bio |
| **Caption / Subtext** | `text-xs text-slate-500` หรือ `text-slate-400` | วันที่, หมวดหมู่, คำอธิบายรอง |

### 2.4 Semantic Status Colors
| Status | Background / Chip | Text Color | Dot Indicator | Meaning |
|---|---|---|---|---|
| **Available / Active** | `bg-emerald-500/15` | `text-emerald-700` | `bg-emerald-500` | พร้อมให้เช่า / ใช้งานปกติ |
| **Rented / In Progress** | `bg-sky-500/15` | `text-sky-700` | `bg-sky-500` | อยู่ระหว่างการเช่า |
| **Maintenance / Warning** | `bg-amber-500/15` | `text-amber-800` | `bg-amber-500` | ซ่อมบำรุง / รอตรวจสอบ |
| **Error / Inactive** | `bg-rose-50 border-rose-200` | `text-rose-700` | `bg-rose-500` | เกิดข้อผิดพลาด / ยกเลิก |

---

## 🧩 3. Component Standards (Copy-Paste Ready)

### 3.1 Buttons (ปุ่มการทำงาน)

#### Primary Action Button (Gradient สวยงาม)
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/15 transition duration-200 hover:from-[#000f22] hover:to-[#1b3554] active:scale-95 disabled:opacity-50"
>
  <Package className="h-4 w-4" />
  <span>บันทึกข้อมูล</span>
</button>
```

#### Secondary / Outline Button (ปุ่มขอบเส้น)
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
>
  <span>ยกเลิก</span>
</button>
```

#### Subtle / Soft Button (ปุ่มสีพื้นเทาอ่อน)
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
>
  <User className="h-3.5 w-3.5" />
  <span>ดูโปรไฟล์</span>
</button>
```

---

### 3.2 Card Containers (กล่องการ์ดเนื้อหา)

#### Standard Section Card
```tsx
<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md">
  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
        <Package className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">หัวข้อการ์ด</h2>
    </div>
  </div>
  {/* เนื้อหาภายในการ์ด */}
</div>
```

---

### 3.3 Form Inputs (ช่องกรอกข้อมูล)

```tsx
<div className="space-y-1.5">
  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
    ชื่ออุปกรณ์ <span className="text-rose-500">*</span>
  </label>
  <input
    type="text"
    placeholder="เช่น Sony A7 III พร้อมเลนส์..."
    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-[#3f6593] focus:ring-4 focus:ring-sky-100"
  />
</div>
```

---

### 3.4 User Avatar & Cover Banner (ส่วนหัวโปรไฟล์)

```tsx
<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md">
  {/* Cover Banner (ความสูงพอดี ไม่บังข้อมูล) */}
  <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-[#000f22] via-[#1b3554] to-[#3f6593]">
    {bannerUrl && (
      <img src={bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
    )}
  </div>

  {/* Profile Details Bar */}
  <div className="relative px-6 pb-6 pt-2 sm:px-8">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
        {/* Avatar Circle with Ring */}
        <div className="relative -mt-12 sm:-mt-16 flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-2xl font-bold text-white shadow-xl ring-4 ring-white">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
          ) : (
            <span>{username?.[0]?.toUpperCase() || "U"}</span>
          )}
        </div>

        <div className="pb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{username}</h1>
            <span className="rounded-full bg-[#c0e6fd]/30 px-2.5 py-0.5 text-xs font-semibold text-[#1b3554]">
              ผู้ให้เช่า (Lender)
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### 3.5 Status Chips & Badges (ป้ายสถานะ)

```tsx
{/* Status: พร้อมให้เช่า */}
<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
  พร้อมให้เช่า
</span>

{/* Status: ไม่พร้อมให้เช่า */}
<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
  ไม่พร้อมให้เช่า
</span>
```

---

## 📐 4. Layout & Responsive Structure

- **Main Page Wrapper**:
  ```tsx
  <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Content */}
    </div>
  </div>
  ```
- **Grid Lists (สำหรับรายการอุปกรณ์ / บัตรสมาชิก)**:
  ```tsx
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {/* Item Cards */}
  </div>
  ```
- **Corner Radii Policy**:
  - การ์ดและกล่องโครงสร้างใหญ่: `rounded-2xl` หรือ `rounded-3xl`
  - ปุ่ม ช่องกรอกข้อมูล และรูปย่อย: `rounded-xl`
  - แท็ก ป้ายสถานะ และ Avatar: `rounded-full`

---

## 🤖 5. Prompt Template สำหรับส่งให้ Claude

```text
คุณคือ Senior Frontend Engineer ผู้เชี่ยวชาญด้าน Next.js (App Router), TypeScript, Tailwind CSS และ React 19

โปรดช่วยสร้าง/ปรับปรุง Component หรือหน้าเว็บสำหรับโปรเจกต์ CHAOCHAO โดยยึดตาม Design System ดังนี้อย่างเคร่งครัด:

1. Palette สี:
   - Primary Brand: #1b3554
   - Midnight Dark: #000f22
   - Steel Blue Accent: #3f6593
   - Sky Light: #c0e6fd
   - Page Background: bg-slate-50
   - Card Background: bg-white ขอบ border-slate-200/80

2. รูปแบบ Component:
   - ปุ่ม Action หลัก: bg-gradient-to-r from-[#1b3554] to-[#3f6593] hover:from-[#000f22] hover:to-[#1b3554] text-white rounded-xl shadow-md active:scale-95
   - การ์ด: rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm
   - ฟอร์มและ Input: rounded-xl border-slate-200 focus:border-[#3f6593] focus:ring-4 focus:ring-sky-100
   - ไอคอน: ใช้ lucide-react เท่านั้น

3. ภาษาและข้อความ:
   - ใช้ภาษาไทยที่เป็นมิตร ชัดเจน อ่านง่าย และถูกต้องตามหลักไวยากรณ์

ความต้องการที่ต้องการให้ทำในงานนี้:
[ใส่รายละเอียดงานที่ต้องการให้ Claude ทำตรงนี้ เช่น: "สร้างหน้าสรุปยอดการเช่าอุปกรณ์สำหรับผู้ให้เช่า"]
```
