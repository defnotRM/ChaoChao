import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = [
  {
    title: "บริษัท",
    links: [
      { label: "เกี่ยวกับเรา", href: "/about" },
      { label: "ติดต่อเรา", href: "/contact" },
      { label: "ร่วมงานกับเรา", href: "/careers" },
    ],
  },
  {
    title: "บริการ",
    links: [
      { label: "ค้นหาอุปกรณ์", href: "/listings" },
      { label: "สำหรับผู้ให้เช่า", href: "/landlord" },
      { label: "สำหรับผู้เช่า", href: "/tenant" },
    ],
  },
  {
    title: "ช่วยเหลือ",
    links: [
      { label: "คำถามที่พบบ่อย", href: "/faq" },
      { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
      { label: "ข้อตกลงการใช้งาน", href: "/terms" },
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
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                aria-label="Facebook"
              >
                
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                aria-label="Instagram"
              >
                
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-white">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
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
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>ลาดกระบัง, กรุงเทพมหานคร</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#c0e6fd]">
                <Phone className="h-4 w-4 shrink-0" />
                <span>02-000-0000</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#c0e6fd]">
                <Mail className="h-4 w-4 shrink-0" />
                <span>contact@chaochao.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-[#80aad3]">
            © {new Date().getFullYear()} ChaoChao. สงวนลิขสิทธิ์ทุกประการ
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-[#80aad3] transition hover:text-white"
            >
              ความเป็นส่วนตัว
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[#80aad3] transition hover:text-white"
            >
              ข้อตกลงการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
