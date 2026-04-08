'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  getFavorites,
  removeFavorite,
} from '@/features/interaction/api/service';
import type { FavoriteItem } from '@/features/interaction/api/types';

type FavTab = 'COURSE' | 'TRAINER' | 'INSTITUTION' | 'CASE';

const TABS: { key: FavTab; label: string }[] = [
  { key: 'COURSE', label: '课程' },
  { key: 'TRAINER', label: '讲师' },
  { key: 'INSTITUTION', label: '机构' },
  { key: 'CASE', label: '案例' },
];

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
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '操作失败');
      }
    },
    [],
  );

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
            placeholder="输入关键字搜索"
            className="border border-slate-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 size-[18px] cursor-pointer hover:text-primary" />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-2 text-center text-gray-400 py-12">加载中...</div>
        )}
        {!loading && items.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 py-12">暂无收藏</div>
        )}
        {!loading &&
          items.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-4 flex gap-3">
              {item.coverUrl ? (
                <Image
                  src={item.coverUrl}
                  alt={item.title || ''}
                  width={tab === 'TRAINER' ? 76 : 120}
                  height={76}
                  className={`${tab === 'TRAINER' ? 'w-[76px] h-[76px] rounded-full' : 'w-[120px] h-[76px] rounded'} object-cover`}
                />
              ) : (
                <div
                  className={`${tab === 'TRAINER' ? 'w-[76px] h-[76px] rounded-full' : 'w-[120px] h-[76px] rounded'} bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0`}
                >
                  暂无图片
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{item.title || `ID: ${item.targetId}`}</div>
                {item.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  收藏于 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '--'}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="text-xs border border-slate-200 rounded px-3 py-1 hover:text-primary hover:border-red-200 transition-colors"
                >
                  取消收藏
                </button>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
