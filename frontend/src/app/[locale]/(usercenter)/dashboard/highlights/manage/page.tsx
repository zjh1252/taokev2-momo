'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getMyHighlights,
  deleteHighlight,
} from '@/features/trainer-highlight/api/service';
import {
  HighlightStatus,
  HighlightStatusLabelMap,
  MediaTypeLabelMap,
  type TrainerHighlight,
} from '@/features/trainer-highlight/api/types';
import {
  Plus,
  Trash2,
  AlertCircle,
  Camera,
  Edit,
  Play,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const STATUS_TABS: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '草稿', value: HighlightStatus.DRAFT },
  { label: '待审核', value: HighlightStatus.PENDING },
  { label: '已通过', value: HighlightStatus.APPROVED },
  { label: '已驳回', value: HighlightStatus.REJECTED },
];

const STATUS_BADGE_STYLES: Record<number, string> = {
  [HighlightStatus.DRAFT]: 'bg-slate-100 text-slate-600',
  [HighlightStatus.PENDING]: 'bg-amber-50 text-amber-600',
  [HighlightStatus.APPROVED]: 'bg-green-50 text-green-600',
  [HighlightStatus.REJECTED]: 'bg-red-50 text-red-600',
};

/**
 * 管理精彩瞬间 — 列表页
 *
 * @author Fangxinxin
 * @date 2026-04-11 18:30
 */
export default function ManageHighlightsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const [highlights, setHighlights] = useState<TrainerHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const filtered = activeTab === undefined
    ? highlights
    : highlights.filter((h) => h.status === activeTab);

  const fetchHighlights = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getMyHighlights();
      setHighlights(list || []);
    } catch {
      setHighlights([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此精彩瞬间吗？')) return;
    try {
      await deleteHighlight(id);
      fetchHighlights();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">管理精彩瞬间</h2>
        <Link
          href={ROUTES.UC_HIGHLIGHTS_CREATE}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          发布新瞬间
        </Link>
      </div>

      <div className="px-6 pt-4 pb-2 flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-3.5 py-1.5 text-sm rounded-full transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Camera className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无精彩瞬间</p>
            <Link
              href={ROUTES.UC_HIGHLIGHTS_CREATE}
              className="mt-4 text-sm text-primary hover:underline"
            >
              去发布第一个精彩瞬间
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
            {filtered.map((item) => (
              <HighlightCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HighlightCard({
  item,
  onDelete,
}: {
  item: TrainerHighlight;
  onDelete: (id: number) => void;
}) {
  const statusLabel = HighlightStatusLabelMap[item.status] || '未知';
  const badgeStyle = STATUS_BADGE_STYLES[item.status] || 'bg-slate-100 text-slate-600';
  const isDraft = item.status === HighlightStatus.DRAFT;
  const isRejected = item.status === HighlightStatus.REJECTED;
  const isVideo = item.mediaType === 2;
  const thumbUrl = item.thumbnailUrl || item.mediaUrl;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-slate-100">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={item.title || '精彩瞬间'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="size-10 text-slate-300" />
          </div>
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="size-8 text-white" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full', badgeStyle)}>
            {statusLabel}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-white">
            {MediaTypeLabelMap[item.mediaType] || '未知'}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 truncate">
          {item.title || '未命名'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>{item.createdAt?.slice(0, 10)}</span>
          <span>浏览 {item.viewCount}</span>
        </div>

        {isRejected && item.rejectReason && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
            <AlertCircle className="size-3" />
            <span className="truncate">{item.rejectReason}</span>
          </div>
        )}

        {(isDraft || isRejected) && (
          <div className="flex gap-2 mt-2">
            <Link
              href={`/dashboard/highlights/${item.id}/edit`}
              className="flex-1 inline-flex items-center justify-center gap-1 text-xs py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
            >
              <Edit className="size-3" />
              编辑
            </Link>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="flex-1 inline-flex items-center justify-center gap-1 text-xs py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="size-3" />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
