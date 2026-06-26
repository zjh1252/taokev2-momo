'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';
import {
  getFavorites,
  removeFavorite,
} from '@/features/interaction/api/service';
import type { FavoriteItem } from '@/features/interaction/api/types';

type FavTab = 'COURSE' | 'TRAINER' | 'INSTITUTION' | 'CASE' | 'VIDEO';

const TABS: { key: FavTab; label: string }[] = [
  { key: 'COURSE', label: '课程' },
  { key: 'TRAINER', label: '专家' },
  { key: 'INSTITUTION', label: '机构' },
  { key: 'CASE', label: '案例' },
  { key: 'VIDEO', label: '视频' },
];

function formatFavoriteDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function videoDetailHref(videoId: number): string {
  return `${ROUTES.VIDEOS}/${videoId}`;
}

/**
 * 我的收藏 — 接入真实后端 API
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
export default function FavoritesPage() {
  const [tab, setTab] = useState<FavTab>('COURSE');
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchFavs = useCallback(async (targetType: FavTab) => {
    setLoading(true);
    try {
      const page = await getFavorites(0, 50, targetType);
      setItems(page.list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavs(tab);
  }, [tab, fetchFavs]);

  const handleRemove = useCallback(
    async (item: FavoriteItem) => {
      try {
        await removeFavorite(item.targetType, item.targetId);
        setItems((prev) => prev.filter((f) => f.id !== item.id));
        toast.success('已取消收藏');
      } catch {
        // 错误提示已在 apiClient 中弹出
      }
    },
    [],
  );

  const isVideoTab = tab === 'VIDEO';
  // 关键字本地过滤（标题/副标题）
  const visibleItems = keyword.trim()
    ? items.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(keyword.trim().toLowerCase()) ||
          (i.subtitle || '').toLowerCase().includes(keyword.trim().toLowerCase()),
      )
    : items;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`py-4 text-[15px] ${tab === t.key ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入关键字搜索"
            className="border border-slate-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 size-[18px] cursor-pointer hover:text-primary" />
        </div>
      </div>

      <div
        className={`p-6 ${isVideoTab ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}
      >
        {loading && (
          <div className={`${isVideoTab ? '' : 'col-span-2'} text-center text-gray-400 py-12`}>
            加载中...
          </div>
        )}
        {!loading && visibleItems.length === 0 && (
          <div className={`${isVideoTab ? '' : 'col-span-2'} text-center text-gray-400 py-12`}>
            暂无收藏
          </div>
        )}
        {!loading &&
          visibleItems.map((item) =>
            isVideoTab ? (
              <VideoFavoriteCard key={item.id} item={item} onRemove={handleRemove} />
            ) : (
              <DefaultFavoriteCard key={item.id} item={item} tab={tab} onRemove={handleRemove} />
            ),
          )}
      </div>
    </section>
  );
}

function VideoFavoriteCard({
  item,
  onRemove,
}: {
  item: FavoriteItem;
  onRemove: (item: FavoriteItem) => void;
}) {
  const unlocked = item.unlocked === true;
  const detailHref = videoDetailHref(item.targetId);
  const actionHref = unlocked ? ROUTES.videoPlay(item.targetId) : detailHref;

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex gap-4 items-start">
      <div className="relative w-[120px] h-[76px] rounded overflow-hidden bg-slate-100 shrink-0">
        <SafeImage
          src={item.coverUrl || undefined}
          alt={item.title || ''}
          fill
          className="object-cover"
          fallback={DEFAULT_VIDEO_COVER}
        />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={detailHref}
          className="font-medium text-gray-900 hover:text-primary line-clamp-2"
        >
          {item.title || `ID: ${item.targetId}`}
        </Link>
        <div className="text-xs text-gray-400 mt-2">
          收藏于 {formatFavoriteDate(item.createdAt)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
        <Link
          href={actionHref}
          className="text-sm text-sky-600 hover:text-sky-700 hover:underline whitespace-nowrap"
        >
          {unlocked ? '在线观看' : '立即购买'}
        </Link>
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="text-sm text-gray-700 hover:text-primary whitespace-nowrap"
        >
          取消收藏
        </button>
      </div>
    </div>
  );
}

function DefaultFavoriteCard({
  item,
  tab,
  onRemove,
}: {
  item: FavoriteItem;
  tab: FavTab;
  onRemove: (item: FavoriteItem) => void;
}) {
  const cover = (
    <div
      className={`relative overflow-hidden bg-slate-100 shrink-0 ${tab === 'TRAINER' ? 'w-[76px] h-[76px] rounded-full' : 'w-[120px] h-[76px] rounded'}`}
    >
      <SafeImage
        src={item.coverUrl || undefined}
        alt={item.title || ''}
        fill
        className="object-cover"
        fallback={DEFAULT_VIDEO_COVER}
      />
    </div>
  );

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex gap-3">
      {item.linkUrl ? <Link href={item.linkUrl}>{cover}</Link> : cover}
      <div className="flex-1 min-w-0">
        {item.linkUrl ? (
          <Link
            href={item.linkUrl}
            className="font-medium text-gray-900 hover:text-primary line-clamp-2"
          >
            {item.title || `ID: ${item.targetId}`}
          </Link>
        ) : (
          <div className="font-medium">{item.title || `ID: ${item.targetId}`}</div>
        )}
        {item.subtitle && (
          <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
        )}
        <div className="text-xs text-gray-400 mt-1">
          收藏于 {formatFavoriteDate(item.createdAt)}
        </div>
      </div>
      <div className="flex items-start shrink-0 pt-1">
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="text-xs text-gray-400 hover:text-primary transition-colors whitespace-nowrap"
        >
          取消收藏
        </button>
      </div>
    </div>
  );
}
