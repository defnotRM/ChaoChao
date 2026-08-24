'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, ArrowLeft, Package } from 'lucide-react';
import { EmptyState } from '@/components/StateHandling';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const historyItems = [
    {
      id: 'ord-101',
      itemName: 'กล้อง Sony A7 III พร้อมเลนส์ 24-70mm',
      startDate: '2026-08-20',
      endDate: '2026-08-23',
      totalPrice: 1500,
      status: 'completed',
      statusLabel: 'คืนอุปกรณ์แล้ว',
    },
    {
      id: 'ord-102',
      itemName: 'ไฟสตูดิโอ LED พร้อมขาตั้ง',
      startDate: '2026-08-22',
      endDate: '2026-08-25',
      totalPrice: 900,
      status: 'active',
      statusLabel: 'กำลังเช่าอยู่',
    }
  ];

  const filteredItems = historyItems.filter((item) => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>กลับหน้าหลัก</span>
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">ประวัติการเช่าอุปกรณ์</h1>
            <p className="text-sm text-slate-500">ตรวจสอบและติดตามรายการเช่าอุปกรณ์ทั้งหมดของคุณ</p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              กำลังเช่า
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8">
            <EmptyState message="ไม่พบรายการในหมวดหมู่นี้" description="คุณยังไม่มีประวัติการทำรายการในหมวดที่เลือก" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#1b3554]">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.itemName}</h3>
                    <p className="text-xs text-slate-500">
                      ระยะเวลา: {item.startDate} ถึง {item.endDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">ยอดรวม</span>
                    <span className="font-bold text-[#1b3554]">฿{item.totalPrice.toLocaleString()}</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-700'
                        : 'bg-sky-500/15 text-sky-700'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {item.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
