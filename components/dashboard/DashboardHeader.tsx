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
  activeRole: 'renter' | 'lender';
  onRoleSwitch?: (newRole: 'renter' | 'lender') => void;
  hasBothRoles: boolean;
}

export function DashboardHeader({
  user,
  activeRole,
  onRoleSwitch,
  hasBothRoles,
}: DashboardHeaderProps) {
  const username = user?.username || 'ผู้ใช้งาน';
  const avatarUrl = user?.avatarUrl;
  const userInitial = username ? username[0].toUpperCase() : 'U';

  const roleTitle =
    activeRole === 'lender' ? 'ผู้ให้เช่า (Lender)' : 'ผู้เช่า (Renter)';

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* User Info & Active Role Badge */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-2xl font-bold text-white shadow-md ring-4 ring-slate-50">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                ยินดีต้อนรับ, {username}
              </h1>
              <span className="rounded-full bg-[#c0e6fd]/40 px-3 py-1 text-xs font-bold text-[#1b3554]">
                {activeRole === 'lender' ? (
                  <span className="flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" />
                    {roleTitle}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {roleTitle}
                  </span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              เข้าสู่ระบบในฐานะ {roleTitle}
            </p>
          </div>
        </div>

        {/* Quick Actions & Role Switch (if user has 2 roles) */}
        <div className="flex flex-wrap items-center gap-3">
          {hasBothRoles && onRoleSwitch && (
            <button
              type="button"
              onClick={() => onRoleSwitch(activeRole === 'lender' ? 'renter' : 'lender')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554]"
            >
              <span>สลับไปมุมมอง {activeRole === 'lender' ? 'ผู้เช่า' : 'ผู้ให้เช่า'}</span>
            </button>
          )}

          {activeRole === 'lender' ? (
            <Link
              href="/lender/postproduct"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>ลงประกาศสินค้า</span>
            </Link>
          ) : (
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
            >
              <Search className="h-4 w-4" />
              <span>ค้นหาอุปกรณ์เช่า</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
