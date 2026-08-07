import "./globals.css";

import type { Metadata } from "next";
import Navbarver2 from "@/components/layout/Navbarver2";
import Footer from "@/components/layout/Footer";

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
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbarver2 />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
