'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RenterDashboardView } from '@/components/dashboard/RenterDashboardView';

export default function RenterMyDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>กลับหน้าหลัก</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">แดชบอร์ดผู้เช่า (Renter Dashboard)</h1>
            <p className="text-xs text-slate-500">ติดตามสถานะรายการสินค้าที่คุณเช่าทั้งหมด</p>
          </div>
        </div>

        <RenterDashboardView />
      </div>
    </div>
  );
}
