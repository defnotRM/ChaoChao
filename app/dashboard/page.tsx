'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RenterDashboardView } from '@/components/dashboard/RenterDashboardView';
import { LenderDashboardView } from '@/components/dashboard/LenderDashboardView';
import { Loader2 } from 'lucide-react';

interface AuthUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  roles: string[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleTab, setActiveRoleTab] = useState<'renter' | 'lender'>('renter');

  useEffect(() => {
    async function checkUserAuth() {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            const userRoles: string[] = data.user.roles || [data.user.role || 'renter'];
            if (userRoles.includes('lender') && !userRoles.includes('renter')) {
              setActiveRoleTab('lender');
            } else {
              setActiveRoleTab('renter');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load auth user in dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    checkUserAuth();
  }, []);

  const roles = user?.roles || (user?.role ? [user.role] : ['renter']);
  const isRenter = roles.includes('renter');
  const isLender = roles.includes('lender') || roles.includes('admin');
  const hasBothRoles = isRenter && isLender;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1b3554] mb-3" />
        <p className="text-sm font-semibold text-slate-600">กำลังเตรียมข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 1. Header with Role Switcher (if user has both roles) */}
        <DashboardHeader
          user={user}
          activeRoleTab={activeRoleTab}
          onRoleTabChange={setActiveRoleTab}
          hasBothRoles={hasBothRoles}
        />

        {/* 2. Conditional Role Dashboard View */}
        {hasBothRoles ? (
          activeRoleTab === 'renter' ? (
            <RenterDashboardView />
          ) : (
            <LenderDashboardView />
          )
        ) : isLender ? (
          <LenderDashboardView />
        ) : (
          <RenterDashboardView />
        )}
      </div>
    </div>
  );
}
