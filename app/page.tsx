import Link from "next/link";
import { BadgeCheck} from "lucide-react";


export default function Home() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-gray-100 p-6 shadow-sm sm:p-10 lg:p-14">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl"
        />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
          <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
            แพลตฟอร์มเช่าอุปกรณ์ที่คุณวางใจได้
          </span>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#000f22] sm:text-4xl md:text-5xl">
            เช่าอุปกรณ์ที่ต้องการ
            <br />
            <span className="text-sky-600">ปล่อยเช่าของที่มี</span>{" "}
            ได้ในที่เดียว
          </h1>

          <p className="mt-3 max-w-xl leading-relaxed text-slate-600">
            CHAOCHAO เชื่อมต่อผู้เช่าและผู้ให้เช่าอุปกรณ์อย่างปลอดภัย
            ยืนยันตัวตน มีมัดจำ หลักฐานรูปภาพ และรีวิวครบทุกขั้นตอน
          </p>

          <Link
            href="/lessee/hireproduct"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-[#1b3554] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#000f22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            Start Now
          </Link>
        </div>
      </section>
    </div>
  );
}
