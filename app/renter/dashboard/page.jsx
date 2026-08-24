'use client';
import React from 'react';
import Link from 'next/link';

export default function RenterDashboard() {
  const activeRentals = [
    { id: 'ORD-001', item: 'Sony Alpha A7 IV', status: 'กำลังใช้งาน', returnDate: '2026-08-30', fee: 1500, deposit: 5000 },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard ผู้เช่า</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-600">รายการที่กำลังเช่า</p>
          <p className="text-2xl font-bold text-blue-900">1</p>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-600">รอคำตอบรับจากเจ้าของ</p>
          <p className="text-2xl font-bold text-yellow-900">0</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-600">เช่าสำเร็จทั้งหมด</p>
          <p className="text-2xl font-bold text-green-900">12</p>
        </div>
      </div>

      {/* Current Rentals */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">รายการเช่าปัจจุบัน</h2>
        {activeRentals.map((item) => (
          <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
            <div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium">{item.status}</span>
              <h3 className="font-semibold text-lg mt-1">{item.item}</h3>
              <p className="text-sm text-gray-500">กำหนดคืน: {item.returnDate}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Link href={`/rental/${item.id}/confirm-return`} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 text-center flex-1">
                ดำเนินการคืนสินค้า
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}