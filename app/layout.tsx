//อย่าแก้ไฟล์นี้ มันเป็น layout หลักของทั้งเว็บให้ไปแก้ page.tsx แทน

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'ChaoChao',
  description: 'ChaoChao Next.js App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">

      <body>{children}</body>

    </html>
  )
}