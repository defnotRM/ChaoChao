'use client';

import React from 'react';
import { EmptyState } from '@/components/StateHandling';

export default function MyItemsPage() {
  const items = [
    {
      id: '1',
      name: 'Sony Alpha A7 IV',
      price: 1500,
      deposit: 5000,
      status: 'available',
    },
    {
      id: '2',
      name: 'DJI Mini 3 Pro',
      price: 800,
      deposit: 3000,
      status: 'rented',
    },
  ];

  if (items.length === 0) {
    return (
      <EmptyState message="คุณยังไม่มีรายการสินค้าที่ลงประกาศไว้" />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          รายการสินค้าของฉัน
        </h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + ลงประกาศสินค้าใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  item.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {item.status === 'available' ? 'ว่าง' : 'ถูกเช่าอยู่'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              ค่าเช่า: ฿{item.price} / วัน (มัดจำ: ฿{item.deposit})
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}