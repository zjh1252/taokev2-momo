'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/service';
import type { NotificationItem } from '../api/types';

/**
 * 通知铃铛组件 — 显示未读红点 + 下拉通知面板
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const getToken = useCallback(() => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    return tokenData?.accessToken ?? null;
  }, []);

  // 轮询未读数
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await getUnreadCount(token);
        setUnreadCount(res.data ?? 0);
      } catch {
        // 静默处理
      }
    };

    fetchCount();
    const timer = setInterval(fetchCount, 5_000);
    return () => clearInterval(timer);
  }, [user, getToken]);

  // 打开面板时加载通知列表
  const handleOpen = useCallback(async () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const token = getToken();
        if (token) {
          setLoading(true);
          getNotifications(token, 1, 10)
            .then((res) => setNotifications(res.data?.list ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
        }
      }
      return next;
    });
  }, [getToken]);

  // 点击外部关闭面板
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // 静默处理
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.isRead === 0) {
      await handleMarkRead(item.id);
    }
    setOpen(false);
    router.push(`${ROUTES.UC_MESSAGES}?notificationId=${item.id}`);
  };

  const handleMarkAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch {
      // 静默处理
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* 铃铛按钮 */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative hover:text-primary transition-colors cursor-pointer p-0.5"
        aria-label="通知"
      >
        <Bell className="size-[15px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉面板 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">消息通知</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary/80 cursor-pointer"
              >
                全部已读
              </button>
            )}
          </div>

          {/* 列表 */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                加载中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                暂无通知
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                    n.isRead === 0 ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => void handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-2">
                    {n.isRead === 0 && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                    <div className={n.isRead === 0 ? '' : 'ml-4'}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                          {n.typeLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {n.title}
                      </p>
                      {n.content && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN');
}
