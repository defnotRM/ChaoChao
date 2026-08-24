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
  const [activeRole, setActiveRole] = useState<'renter' | 'lender'>('renter');

  useEffect(() => {
    async function checkUserAuth() {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            const loginRole = data.user.role === 'lender' ? 'lender' : 'renter';
            setActiveRole(loginRole);
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
  const hasBothRoles = roles.includes('renter') && (roles.includes('lender') || roles.includes('admin'));

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
        {/* 1. Header with Active Login Role */}
        <DashboardHeader
          user={user}
          activeRole={activeRole}
          onRoleSwitch={setActiveRole}
          hasBothRoles={hasBothRoles}
        />

        {/* 2. Render View for the exact logged-in role */}
        {activeRole === 'lender' ? (
          <LenderDashboardView />
        ) : (
          <RenterDashboardView />
        )}
      </div>
    </div>
  );
}
