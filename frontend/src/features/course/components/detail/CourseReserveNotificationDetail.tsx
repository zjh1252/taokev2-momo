'use client';

import { useMemo } from 'react';
import { Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationItem } from '@/features/user-center/api/service';

interface CourseReserveNotificationDetailProps {
  item: NotificationItem;
  onClose: () => void;
}

function parseReserveContent(content: string) {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const fields: Record<string, string> = {};
  let liveUrl = '';

  for (const line of lines) {
    if (line.startsWith('直播会议链接：')) {
      liveUrl = line.replace('直播会议链接：', '').trim();
      fields['直播会议链接'] = liveUrl;
      continue;
    }
    const sep = line.indexOf('：');
    if (sep > 0) {
      const key = line.slice(0, sep);
      const value = line.slice(sep + 1);
      fields[key] = value;
    }
  }

  return { heading: lines[0] ?? '线上公开课预约成功通知', fields, liveUrl };
}

export function CourseReserveNotificationDetail({
  item,
  onClose,
}: CourseReserveNotificationDetailProps) {
  const parsed = useMemo(() => parseReserveContent(item.content || ''), [item.content]);

  const copyLiveUrl = async () => {
    if (!parsed.liveUrl) {
      toast.error('暂无直播链接');
      return;
    }
    try {
      await navigator.clipboard.writeText(parsed.liveUrl);
      toast.success('链接已复制');
    } catch {
      toast.error('复制失败，请手动复制链接');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-gray-800">{parsed.heading}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-2 text-sm text-gray-700">
          {Object.entries(parsed.fields).map(([key, value]) => (
            <p key={key}>
              <span className="font-medium text-gray-800">{key}：</span>
              {key === '直播会议链接' ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all"
                >
                  {value}
                </a>
              ) : (
                <span>{value}</span>
              )}
            </p>
          ))}
          {!item.content && <p className="text-gray-500">暂无详细内容</p>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {parsed.liveUrl ? (
            <button
              type="button"
              onClick={copyLiveUrl}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Copy className="size-4" />
              复制链接
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
