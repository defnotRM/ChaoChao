import React from 'react';
import { Inbox, AlertCircle, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  message = "ไม่พบข้อมูล",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{message}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = "กำลังโหลดข้อมูล..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#1b3554] mb-3" />
      <p className="text-sm text-slate-600 font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({
  message = "เกิดข้อผิดพลาดในการโหลดข้อมูล",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{message}</h3>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
}
