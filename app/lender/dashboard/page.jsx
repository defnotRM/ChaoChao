'use client';
import React from 'react';

export default function LenderDashboard() {
  const pendingRequests = [
    { id: 'ORD-002', item: 'DJI Mini 3 Pro', renter: 'สมชาย สายเช่า', dates: '1-3 ก.ย. 2026', total: 2400 },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard ผู้ให้เช่า</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-sm text-purple-600">รายได้ประมาณการ (เดือนนี้)</p>
          <p className="text-2xl font-bold text-purple-900">฿8,500</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm text-orange-600">คำขอเช่าที่รออนุมัติ</p>
          <p className="text-2xl font-bold text-orange-900">1</p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm text-emerald-600">สินค้าว่างพร้อมเช่า</p>
          <p className="text-2xl font-bold text-emerald-900">5 ชิ้น</p>
        </div>
      </div>

      {/* Pending Approval Requests */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">คำขอเช่าที่รออนุมัติ</h2>
        {pendingRequests.map((req) => (
          <div key={req.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
            <div>
              <h3 className="font-semibold text-base">{req.item}</h3>
              <p className="text-sm text-gray-600">ผู้เช่า: {req.renter} | วันที่: {req.dates}</p>
              <p className="text-sm font-semibold text-blue-600 mt-1">ยอดรวม: ฿{req.total}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex-1">อนุมัติ</button>
              <button className="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 flex-1">ปฏิเสธ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}