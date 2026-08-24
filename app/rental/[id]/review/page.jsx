'use client';
import React, { useState } from 'react';

export default function WriteReviewPage() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="p-6 max-w-xl mx-auto bg-white border rounded-xl space-y-6">
      <h1 className="text-xl font-bold text-gray-800">เขียนรีวิวการเช่า</h1>
      
      {/* Star Rating (US-30, FR-25) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ให้คะแนนประสบการณ์</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Review Text (US-28) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ความเห็นเพิ่มเติม</label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="บอกเล่าประสบการณ์ สภาพสินค้า หรือการให้บริการของผู้ให้เช่า..."
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      {/* Upload Images (US-29) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพประกอบ (ถ้ามี)</label>
        <input type="file" multiple accept="image/*" className="text-sm text-gray-500" />
      </div>

      <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
        โพสต์รีวิว[cite: 1]
      </button>
    </div>
  );
}