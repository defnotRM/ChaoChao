'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  RotateCcw,
  MessageCircle,
  ChevronRight,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/StateHandling';

interface RenterOrder {
  order_id: string;
  user_id?: string;
  item_id: string;
  start_date: string;
  end_date: string;
  rental_fee: number;
  deposit: number;
  total_paid: number;
  status: string;
  meetup_location?: string;
  return_location?: string;
  created_at: string;
  hasPendingPayment?: boolean;
  item?: {
    item_id: string;
    item_name: string;
    description: string;
    rental_fee_per_day: number;
    deposit: number;
    status: string;
    lender?: {
      username: string;
      avatarUrl?: string;
    };
  };
}

interface RenterMetrics {
  active: number;
  pending: number;
  completed: number;
  totalSpent: number;
}

export function RenterDashboardView({ userId }: { userId?: string } = {}) {
  const [orders, setOrders] = useState<RenterOrder[]>([]);
  const [metrics, setMetrics] = useState<RenterMetrics>({
    active: 0,
    pending: 0,
    completed: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const url = userId
          ? `/api/dashboard/renter?userId=${encodeURIComponent(userId)}`
          : '/api/dashboard/renter';
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Pragma: 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          setMetrics(data.metrics || { active: 0, pending: 0, completed: 0, totalSpent: 0 });
        }
      } catch (err) {
        console.error('Failed to load renter dashboard data:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadData(false);

    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`renter-dashboard-realtime-${userId || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentalorder' }, () => {
        loadData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, () => {
        loadData(true);
      })
      .subscribe();

    const interval = setInterval(() => {
      loadData(true);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, loadData]);

  const getStatusBadge = (status: string, hasPendingPayment = false) => {
    switch (status) {
      case 'requested':
        return {
          label: 'รอเจ้าของอนุมัติ',
          className: 'bg-amber-500/15 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'awaiting_payment':
        if (hasPendingPayment) {
          return {
            label: 'รอร้านค้าตรวจการชำระเงิน',
            className: 'bg-amber-500/15 text-amber-800 border-amber-200',
            dot: 'bg-amber-500',
          };
        }
        return {
          label: 'รอการชำระเงิน',
          className: 'bg-sky-500/15 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'paid':
        return {
          label: 'ชำระแล้ว / รอนัดรับ',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'item_sent':
        return {
          label: 'กำลังใช้งานอุปกรณ์',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'item_returned':
        return {
          label: 'ส่งคืนอุปกรณ์แล้ว',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        };
      case 'completed':
        return {
          label: 'เช่าสำเร็จเรียบร้อย',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'rejected':
      case 'cancelled':
        return {
          label: 'ยกเลิกแล้ว',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b3554] mb-3" />
        <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลแดชบอร์ดผู้เช่า...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Metrics Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">กำลังเช่า</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#1b3554]">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.active}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">รายการที่กำลังดำเนินการ</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รอคำตอบรับ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.pending}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">คำขอที่รอเจ้าของตอบ</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">เช่าสำเร็จ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.completed}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">ประวัติการเช่าที่สมบูรณ์</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ยอดรวมค่าเช่า</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ฿{metrics.totalSpent.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">ยอดเงินการเช่าทั้งหมด</span>
        </div>
      </div>

      {/* 2. Rented Items List Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">รายการสินค้าที่คุณเช่า</h2>
              <p className="text-xs text-slate-500">ติดตามสถานะและจัดการการส่งคืนอุปกรณ์</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
            ทั้งหมด {orders.length} รายการ
          </span>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            message="คุณยังไม่มีรายการเช่าอุปกรณ์ในขณะนี้"
            description="ค้นหาอุปกรณ์ที่คุณต้องการใช้งาน ไม่ว่าจะเป็นกล้อง ไฟสตูดิโอ หรืออุปกรณ์แคมป์ปิ้ง"
            action={
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554]"
              >
                <Sparkles className="h-4 w-4" />
                <span>ค้นหาอุปกรณ์ให้เช่า</span>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const badge = getStatusBadge(order.status, !!order.hasPendingPayment);
              const itemName = order.item?.item_name || 'รายการอุปกรณ์';
              const lenderName = order.item?.lender?.username || 'เจ้าของสินค้า';

              return (
                <div
                  key={order.order_id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:border-[#3f6593]/40 hover:shadow-md"
                >
                  {/* Item & Order Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#1b3554]">
                      <Package className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{itemName}</h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          ระยะเวลาเช่า: <strong className="text-slate-700">{order.start_date}</strong> ถึง{' '}
                          <strong className="text-slate-700">{order.end_date}</strong>
                        </span>
                      </p>

                      <p className="text-xs text-slate-500">
                        ผู้ให้เช่า: <span className="font-semibold text-slate-700">{lenderName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">ค่าเช่ารวม</span>
                      <span className="text-base font-bold text-[#1b3554]">
                        ฿{(Number(order.total_paid) || Number(order.rental_fee) || 0).toLocaleString()}
                      </span>
                      {order.deposit ? (
                        <span className="text-[10px] text-slate-400 block">
                          (มัดจำ ฿{Number(order.deposit).toLocaleString()})
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'item_sent' && (
                        <Link
                          href={`/renter/myproductsList/${order.order_id}/return`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-800 active:scale-95"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>ดำเนินการคืนสินค้า</span>
                        </Link>
                      )}

                      {order.status === 'awaiting_payment' && (
                        <Link
                          href={`/renter/myproductsList/${order.order_id}/payment`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>ไปชำระเงิน</span>
                        </Link>
                      )}

                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554]"
                        title="แชทกับเจ้าของสินค้า"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>ติดต่อ</span>
                      </Link>

                      <Link
                        href={`/dashboard/${userId || order.user_id}/rent/${order.order_id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                        title="ดูรายละเอียดคำสั่งเช่า"
                      >
                        <span>ดูรายละเอียดคำสั่งเช่า</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
