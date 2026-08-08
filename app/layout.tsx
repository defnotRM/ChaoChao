import "./globals.css";

import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import Navbarver2 from "@/components/layout/Navbarver2";
import Footer from "@/components/layout/Footer";

const kanit = Kanit({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "ChaoChao",
  description: "ChaoChao Next.js App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={kanit.className}>
      <body className="flex min-h-screen flex-col bg-[#f8fafc]">
        <Navbarver2 />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
