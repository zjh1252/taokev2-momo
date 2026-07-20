'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

interface CourseReserveSuccessDialogProps {
  open: boolean;
  paid?: boolean;
  onClose: () => void;
}

/**
 * 线上公开课预约/购买成功提示弹窗
 */
export function CourseReserveSuccessDialog({
  open,
  paid = false,
  onClose,
}: CourseReserveSuccessDialogProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  const title = paid ? '支付成功' : '预约成功';
  const description = paid
    ? '课程通知已发送至您的消息中心，内含直播会议链接与开课时间。'
    : '课程通知已发送至您的消息中心，内含直播会议链接与开课时间。';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            我知道了
          </button>
          <Link
            href={ROUTES.UC_MESSAGES}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium text-center hover:bg-primary/90 transition-colors"
          >
            前往消息中心
          </Link>
        </div>
      </div>
    </div>
  );
}
