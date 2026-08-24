'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Store,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Plus,
  Edit,
  MessageCircle,
  Calendar,
  ChevronRight,
  Loader2,
  User,
  Layers,
} from 'lucide-react';
import { EmptyState } from '@/components/StateHandling';

interface LenderItem {
  item_id: string;
  item_name: string;
  description: string;
  rental_fee_per_day: number;
  deposit: number;
  status: string;
  created_at: string;
  category?: {
    category_name: string;
  };
}

interface IncomingOrder {
  order_id: string;
  item_id: string;
  start_date: string;
  end_date: string;
  rental_fee: number;
  deposit: number;
  total_paid: number;
  status: string;
  created_at: string;
  hasPendingPayment?: boolean;
  item?: {
    item_name: string;
  };
  renter?: {
    username: string;
    avatarUrl?: string;
    phone?: string;
  };
}

interface LenderMetrics {
  totalItems: number;
  availableItems: number;
  rentedItems: number;
  pendingRequests: number;
  estimatedIncome: number;
}

export function LenderDashboardView({ userId }: { userId?: string } = {}) {
  const [items, setItems] = useState<LenderItem[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<IncomingOrder[]>([]);
  const [metrics, setMetrics] = useState<LenderMetrics>({
    totalItems: 0,
    availableItems: 0,
    rentedItems: 0,
    pendingRequests: 0,
    estimatedIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const url = userId
          ? `/api/dashboard/lender?userId=${encodeURIComponent(userId)}`
          : '/api/dashboard/lender';
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Pragma: 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setIncomingOrders(data.incomingOrders || []);
          setMetrics(
            data.metrics || {
              totalItems: 0,
              availableItems: 0,
              rentedItems: 0,
              pendingRequests: 0,
              estimatedIncome: 0,
            }
          );
        }
      } catch (err) {
        console.error('Failed to load lender dashboard data:', err);
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
      .channel(`lender-dashboard-realtime-${userId || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentalorder' }, () => {
        loadData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item' }, () => {
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

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'พร้อมให้เช่า',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'rented':
        return {
          label: 'ถูกเช่าอยู่',
          className: 'bg-sky-500/15 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'maintenance':
        return {
          label: 'ซ่อมบำรุง',
          className: 'bg-amber-500/15 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      default:
        return {
          label: 'ไม่พร้อมให้เช่า',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const getOrderStatusBadge = (status: string, hasPendingPayment = false) => {
    switch (status) {
      case 'requested':
        return {
          label: 'คำขอใหม่ รออนุมัติ',
          className: 'bg-amber-500/15 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'awaiting_payment':
        if (hasPendingPayment) {
          return {
            label: 'รอผู้ให้เช่าตรวจการชำระเงิน',
            className: 'bg-amber-500/15 text-amber-800 border-amber-200',
            dot: 'bg-amber-500',
          };
        }
        return {
          label: 'รอผู้เช่าชำระเงิน',
          className: 'bg-sky-500/15 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'paid':
        return {
          label: 'ชำระแล้ว รอนัดส่งมอบ',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'item_sent':
        return {
          label: 'ผู้เช่ากำลังใช้งาน',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'item_returned':
        return {
          label: 'ส่งคืนแล้ว รอตรวจสภาพ',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'completed':
        return {
          label: 'เสร็จสิ้นเรียบร้อย',
          className: 'bg-emerald-500/15 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
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
        <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลแดชบอร์ดผู้ให้เช่า...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Metrics Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายได้โดยประมาณ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ฿{metrics.estimatedIncome.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">รายได้จากการปล่อยเช่า</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">คำขอเช่าใหม่</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.pendingRequests}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">รอตรวจสอบและอนุมัติ</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">สินค้าพร้อมเช่า</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.availableItems}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">สถานะพร้อมใช้งาน</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">สินค้าทั้งหมด</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#1b3554]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.totalItems}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">ลงประกาศในระบบแล้ว</span>
        </div>
      </div>

      {/* 2. Incoming Rental Orders Section */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">คำขอเช่าและออเดอร์ที่เข้ามา</h2>
              <p className="text-xs text-slate-500">ติดตามคำขอเช่าและสถานะการเช่าของสินค้าคุณ</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
            {incomingOrders.length} รายการ
          </span>
        </div>

        {incomingOrders.length === 0 ? (
          <EmptyState
            message="ยังไม่มีคำขอเช่าเข้ามาในขณะนี้"
            description="เมื่อมีผู้สนใจเช่าอุปกรณ์ของคุณ รายการคำขอเช่าจะปรากฏขึ้นที่นี่โดยอัตโนมัติ"
          />
        ) : (
          <div className="space-y-4">
            {incomingOrders.map((order) => {
              const badge = getOrderStatusBadge(order.status, !!order.hasPendingPayment);
              const itemName = order.item?.item_name || 'รายการสินค้า';
              const renterName = order.renter?.username || 'ผู้เช่า';

              return (
                <div
                  key={order.order_id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:border-[#3f6593]/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#1b3554]">
                      <Package className="h-6 w-6" />
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
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          ผู้เช่า: <strong className="text-slate-700">{renterName}</strong>
                        </span>
                        {order.renter?.phone && (
                          <span className="text-slate-400">({order.renter.phone})</span>
                        )}
                      </p>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          วันที่: {order.start_date} ถึง {order.end_date}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">ค่าเช่า</span>
                      <span className="text-base font-bold text-emerald-700">
                        +฿{(Number(order.rental_fee) || Number(order.total_paid) || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>แชท</span>
                      </Link>

                      <Link
                        href={`/dashboard/${userId || 'b5041d3d-ba07-4230-96fa-3fbfb4411439'}/lend/${order.order_id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        <span>จัดการ</span>
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

      {/* 3. Listed Items Section */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c0e6fd]/30 text-[#1b3554]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">สินค้าที่คุณลงประกาศไว้</h2>
              <p className="text-xs text-slate-500">จัดการข้อมูล แก้ไขราคา และสถานะความพร้อมให้เช่า</p>
            </div>
          </div>

          <Link
            href="/lender/postproduct"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            message="คุณยังไม่มีรายการสินค้าที่ลงประกาศไว้"
            description="เริ่มต้นสร้างรายได้จากการนำอุปกรณ์ไอที กล้อง หรือเครื่องมือที่ไม่ได้ใช้งานมาปล่อยเช่า"
            action={
              <Link
                href="/lender/postproduct"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#000f22] hover:to-[#1b3554]"
              >
                <Plus className="h-4 w-4" />
                <span>ลงประกาศสินค้าชิ้นแรก</span>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const badge = getItemStatusBadge(item.status);

              return (
                <div
                  key={item.item_id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:border-[#3f6593]/40 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1b3554]">
                        <Package className="h-5 w-5" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">{item.item_name}</h3>
                      {item.category?.category_name && (
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          หมวดหมู่: {item.category.category_name}
                        </span>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">ค่าเช่าต่อวัน</span>
                      <span className="text-sm font-bold text-[#1b3554]">
                        ฿{Number(item.rental_fee_per_day).toLocaleString()}/วัน
                      </span>
                    </div>

                    <Link
                      href={`/lender/editmyproductList/${item.item_id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554]"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>แก้ไข</span>
                    </Link>
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
