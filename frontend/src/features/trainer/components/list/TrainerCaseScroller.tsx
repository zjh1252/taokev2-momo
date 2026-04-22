'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { getRecentTrainerCases, type RecentTrainerCase } from '../../api/service';

/**
 * 专家列表页「最新案例」单行横向滚动条
 *
 * <p>展示规则（与老站对齐）：</p>
 * <ul>
 *   <li>无标题/副标题，单行横向无限匀速滚动；hover 暂停。</li>
 *   <li>每屏 2 条，每条仅显示「NEW 标 + 案例标题 + 评分」一行布局，无封面图。</li>
 *   <li>无数据时整块隐藏。点击行跳转到对应专家详情页 {@code ?tab=cases}。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 20:10
 */
export function TrainerCaseScroller({
  initialItems,
}: {
  initialItems?: RecentTrainerCase[];
}) {
  const [items, setItems] = useState<RecentTrainerCase[]>(initialItems ?? []);
  const [loaded, setLoaded] = useState(Boolean(initialItems));

  useEffect(() => {
    if (initialItems && initialItems.length > 0) return;
    let mounted = true;
    getRecentTrainerCases(10)
      .then((list) => {
        if (!mounted) return;
        setItems(list);
        setLoaded(true);
      })
      .catch(() => mounted && setLoaded(true));
    return () => {
      mounted = false;
    };
  }, [initialItems]);

  if (!loaded || !items || items.length === 0) return null;

  const enableScroll = items.length > 2;
  const loopItems = enableScroll ? [...items, ...items] : items;
  const durationSec = Math.max(items.length * 4, 14);

  return (
    <div className="relative h-12 overflow-hidden group bg-white border border-slate-100 rounded-xl shadow-sm">
      <div
        className={
          enableScroll
            ? 'flex gap-0 h-full will-change-transform animate-trainer-marquee group-hover:[animation-play-state:paused]'
            : 'flex gap-0 h-full'
        }
        style={enableScroll ? { animationDuration: `${durationSec}s` } : undefined}
      >
        {loopItems.map((c, idx) => (
          <Link
            key={`${c.id}-${idx}`}
            href={`/trainers/${c.trainerId}?tab=cases`}
            className="shrink-0 basis-1/2 h-full px-4 flex items-center gap-3 border-r border-slate-100 last:border-r-0 cursor-pointer hover:bg-primary/5 transition-colors group/item"
          >
            <span className="shrink-0 inline-flex items-center justify-center px-1.5 h-[18px] rounded text-[10px] font-bold tracking-wider text-white bg-rose-500">
              NEW
            </span>
            <span className="flex-1 min-w-0 text-[14px] text-slate-800 line-clamp-1 group-hover/item:text-primary transition-colors">
              {c.caseTitle}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-rose-500">
              {formatScore(c)}分
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatScore(c: RecentTrainerCase): string {
  const s = c.trainerScore;
  if (typeof s === 'number' && s > 0) return s.toFixed(2);
  return '-';
}
