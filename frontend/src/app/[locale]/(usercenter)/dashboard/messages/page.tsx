'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/features/user-center/api/service';
import { Trash2, Eye, X } from 'lucide-react';

/** 已发消息 mock 数据 */
const SENT_MOCK: NotificationItem[] = [
  {
    id: 9001,
    type: 'SYSTEM',
    typeLabel: '系统',
    title: '课程咨询资料已发送',
    content: '',
    relatedId: null,
    relatedUrl: null,
    isRead: 1,
    createdAt: '2026-03-30T09:12:00',
  },
];

/**
 * 消息中心 — 收到消息接入后端 /notifications，已发消息写死
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:00
 */
export default function MessagesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'received' | 'sent'>('received');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailItem, setDetailItem] = useState<NotificationItem | null>(null);

  const fetchNotifications = useCallback(async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;
    setLoading(true);
    try {
      const res = await getNotifications(tokenData.accessToken);
      setNotifications(res.data?.list || []);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;
    await markNotificationRead(tokenData.accessToken, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n)),
    );
  };

  const handleMarkAllRead = async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;
    await markAllNotificationsRead(tokenData.accessToken);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
  };

  const handleViewDetail = (item: NotificationItem) => {
    setDetailItem(item);
    if (tab === 'received' && item.isRead === 0) {
      handleMarkRead(item.id);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (items: NotificationItem[]) => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((n) => n.id)));
    }
  };

  const currentItems = tab === 'received' ? notifications : SENT_MOCK;

  return (
    <>
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-8">
          <button
            type="button"
            onClick={() => setTab('received')}
            className={`py-4 text-[15px] ${tab === 'received' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
          >
            收到消息
          </button>
          <button
            type="button"
            onClick={() => setTab('sent')}
            className={`py-4 text-[15px] ${tab === 'sent' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
          >
            已发消息
          </button>
        </div>

        <div className="p-6 flex flex-col">
          {/* 操作栏 */}
          <div className="flex items-center gap-4 mb-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-primary transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
                checked={
                  currentItems.length > 0 &&
                  selectedIds.size === currentItems.length
                }
                onChange={() => toggleSelectAll(currentItems)}
              />
              <span>全选</span>
            </label>
            <button
              type="button"
              className="text-sm border border-slate-200 rounded px-3 py-1.5 hover:border-red-200 hover:text-primary transition-colors flex items-center gap-1"
            >
              <Trash2 className="size-4" />
              删除
            </button>
            {tab === 'received' && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-sm border border-slate-200 rounded px-3 py-1.5 hover:border-red-200 hover:text-primary transition-colors"
              >
                全部已读
              </button>
            )}
          </div>

          {/* 表格 */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-gray-600 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3 text-center" />
                  <th className="w-32 px-4 py-3 font-medium">
                    {tab === 'received' ? '发信人' : '收信人'}
                  </th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="w-24 px-4 py-3 font-medium">状态</th>
                  <th className="w-40 px-4 py-3 font-medium">发送时间</th>
                  <th className="w-20 px-4 py-3 font-medium text-center">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                )}
                {!loading && currentItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      暂无消息
                    </td>
                  </tr>
                )}
                {!loading &&
                  currentItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="px-4 py-4 text-gray-800">
                        {tab === 'received' ? '淘课网' : '培训机构A'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item)}
                          className={`${item.isRead === 0 ? 'font-medium' : ''} text-gray-800 hover:text-primary transition-colors cursor-pointer text-left`}
                        >
                          {item.title}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        {item.isRead === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-primary border border-red-100">
                            未读
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {tab === 'received' ? '已读' : '已发'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item)}
                          className="text-gray-500 hover:text-primary transition-colors text-xs flex items-center justify-center gap-1"
                        >
                          <Eye className="size-4" />
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 消息详情弹窗 */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                  {detailItem.typeLabel}
                </span>
                <h3 className="font-bold text-gray-800">{detailItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {detailItem.content || '暂无详细内容'}
              </p>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-gray-400">
              <span>发送时间：{new Date(detailItem.createdAt).toLocaleString('zh-CN')}</span>
              {detailItem.relatedUrl && (
                <a
                  href={detailItem.relatedUrl}
                  className="text-primary hover:underline"
                >
                  查看关联内容
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
