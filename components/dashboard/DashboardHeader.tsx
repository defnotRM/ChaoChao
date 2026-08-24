'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Store, Plus, Search } from 'lucide-react';

interface DashboardHeaderProps {
  user: {
    username?: string;
    avatarUrl?: string | null;
    role?: string;
    roles?: string[];
  } | null;
  activeRoleTab: 'renter' | 'lender';
  onRoleTabChange: (tab: 'renter' | 'lender') => void;
  hasBothRoles: boolean;
}

export function DashboardHeader({
  user,
  activeRoleTab,
  onRoleTabChange,
  hasBothRoles,
}: DashboardHeaderProps) {
  const username = user?.username || 'ผู้ใช้งาน';
  const avatarUrl = user?.avatarUrl;
  const userInitial = username ? username[0].toUpperCase() : 'U';

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-2xl font-bold text-white shadow-md ring-4 ring-slate-50">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                ยินดีต้อนรับ, {username}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <LayoutDashboard className="h-3.5 w-3.5" />
                แดชบอร์ดจัดการระบบ
              </span>
              {hasBothRoles && (
                <span className="rounded-full bg-[#c0e6fd]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#1b3554]">
                  ผู้เช่าและผู้ให้เช่า
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/lender/addmyproductList"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>ลงประกาศสินค้า</span>
          </Link>
          <Link
            href="/renter/hireproduct"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
          >
            <Search className="h-4 w-4" />
            <span>ค้นหาอุปกรณ์เช่า</span>
          </Link>
        </div>
      </div>

      {/* Dual Role Segmented Tab Switcher */}
      {hasBothRoles && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex rounded-2xl bg-slate-100 p-1 max-w-md">
            <button
              type="button"
              onClick={() => onRoleTabChange('renter')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition duration-150 ${
                activeRoleTab === 'renter'
                  ? 'bg-white text-[#1b3554] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>การเช่าของฉัน (ผู้เช่า)</span>
            </button>
            <button
              type="button"
              onClick={() => onRoleTabChange('lender')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition duration-150 ${
                activeRoleTab === 'lender'
                  ? 'bg-white text-[#1b3554] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>การให้เช่าของฉัน (ผู้ให้เช่า)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
