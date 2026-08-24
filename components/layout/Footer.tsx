import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = [
  {
    title: "บริษัท",
    links: [
      { label: "เกี่ยวกับเรา", href: "/" },
      { label: "ค้นหาอุปกรณ์", href: "/products" },
      { label: "กล่องข้อความ", href: "/chat" },
    ],
  },
  {
    title: "บริการ",
    links: [
      { label: "ค้นหาอุปกรณ์", href: "/products" },
      { label: "สำหรับผู้ให้เช่า", href: "/lender" },
      { label: "สำหรับผู้เช่า", href: "/renter" },
    ],
  },
  {
    title: "ช่วยเหลือ",
    links: [
      { label: "แดชบอร์ดผู้เช่า", href: "/renter/mydashboard" },
      { label: "แดชบอร์ดผู้ให้เช่า", href: "/lender/mydashboard" },
      { label: "โปรไฟล์ของฉัน", href: "/profile" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-[#000f22] via-[#1b3554] to-[#3f6593] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
                  <path d="M15 21a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3" />
                </svg>
              </div>
              <span className="text-lg font-bold">ChaoChao</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#c0e6fd]">
              ระบบจัดการเช่า/ให้เช่าอุปกรณ์อิเล็กทรอนิกส์ที่ช่วยให้การจัดการอุปกรณ์
              และการติดต่อระหว่างผู้เช่ากับผู้ให้เช่าเป็นเรื่องง่าย
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-white">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#c0e6fd] transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white">ติดต่อเรา</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-[#c0e6fd]">
                <MapPin className="h-4 w-4 shrink-0 text-sky-300" />
                <span>King Mongkut's Institute of Technology Ladkrabang, Bangkok, Thailand</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#c0e6fd]">
                <Phone className="h-4 w-4 shrink-0 text-sky-300" />
                <span>02-123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#c0e6fd]">
                <Mail className="h-4 w-4 shrink-0 text-sky-300" />
                <span>contact@chaochao.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-[#c0e6fd]">
          &copy; {new Date().getFullYear()} ChaoChao. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
