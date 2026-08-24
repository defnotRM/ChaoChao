'use client';
import React, { useState } from 'react';

export default function ConfirmReceivePage() {
  const [images, setImages] = useState([]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white border rounded-xl space-y-6">
      <h1 className="text-xl font-bold text-gray-800">ยืนยันการรับสินค้า</h1>
      <p className="text-sm text-gray-500">กรุณาถ่ายภาพและอัปโหลดหลักฐานสภาพสินค้าก่อนการใช้งานเพื่อความปลอดภัย (US-19, FR-22)[cite: 1]</p>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
        <input type="file" multiple onChange={handleImageChange} className="hidden" id="before-evidence" accept="image/*" />
        <label htmlFor="before-evidence" className="cursor-pointer space-y-2 block">
          <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดรูปภาพหลักฐานสภาพสินค้าก่อนเช่า</p>
          <p className="text-xs text-gray-400">รองรับไฟล์ JPG, PNG ไม่เกิน 10MB ต่อไฟล์[cite: 1]</p>
        </label>
      </div>

      {/* Uploaded Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((file, idx) => (
            <div key={idx} className="h-20 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 overflow-hidden">
              {file.name}
            </div>
          ))}
        </div>
      )}

      <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
        ยืนยันการรับสินค้าถูกต้อง (Confirm Handover)
      </button>
    </div>
  );
}