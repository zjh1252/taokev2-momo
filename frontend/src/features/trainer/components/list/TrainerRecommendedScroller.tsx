'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getTopRecommendedTrainers } from '../../api/service';
import type { TrainerListItem } from '../../types';

/**
 * 专家列表页右上角「推荐位」横向滚动条
 *
 * <p>展示规则（与老站一致）：</p>
 * <ul>
 *   <li>无标题/副标题，纯 3 张大图横向铺满。</li>
 *   <li>每屏 3 张，CSS 动画无限横向匀速滚动；hover 暂停。</li>
 *   <li>图片底部叠加渐变与「名字 + 头衔/一句话简介」，与左侧筛选侧栏等高。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 20:00
 */
export function TrainerRecommendedScroller({
  initialItems,
}: {
  initialItems?: TrainerListItem[];
}) {
  const [items, setItems] = useState<TrainerListItem[]>(initialItems ?? []);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) return;
    let mounted = true;
    getTopRecommendedTrainers(9)
      .then((list) => mounted && setItems(list))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [initialItems]);

  if (!items || items.length === 0) {
    return null;
  }

  const enableScroll = items.length > 3;
  const loopItems = enableScroll ? [...items, ...items] : items;
  const durationSec = Math.max(items.length * 4, 14);

  return (
    <div className="relative h-full overflow-hidden group rounded-xl">
      <div
        className={
          enableScroll
            ? 'flex gap-3 h-full will-change-transform animate-trainer-marquee group-hover:[animation-play-state:paused]'
            : 'flex gap-3 h-full'
        }
        style={enableScroll ? { animationDuration: `${durationSec}s` } : undefined}
      >
        {loopItems.map((t, idx) => (
          <Link
            key={`${t.id}-${idx}`}
            href={`/trainers/${t.id}`}
            className="shrink-0 basis-[calc((100%-1rem)/3)] relative cursor-pointer overflow-hidden rounded-md group/item bg-slate-100"
          >
            <Image
              src={t.avatar || '/statics/images/expert-main.jpg'}
              alt={t.name}
              fill
              sizes="(max-width: 1024px) 33vw, 320px"
              className="object-cover transition-transform duration-500 group-hover/item:scale-[1.04]"
            />
            {/* 底部渐变 + 文案叠层 */}
            <div className="absolute inset-x-0 bottom-0 px-4 pt-12 pb-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-white">
              <h4 className="text-[15px] font-semibold mb-0.5 line-clamp-1">{t.name}</h4>
              {t.title && (
                <p className="text-[12px] opacity-90 line-clamp-2 leading-snug">{t.title}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
