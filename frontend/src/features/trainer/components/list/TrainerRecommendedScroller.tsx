'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { getTopRecommendedTrainers } from '../../api/service';
import type { TrainerListItem } from '../../types';
import { pickDisplayTitle, plainIntroOrUndefined } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';

/**
 * 专家列表页右上角「推荐位」步进式滚动条
 *
 * <p>展示规则（与老站对齐）：</p>
 * <ul>
 *   <li>无标题/副标题，纯 3 张大图横向铺满，与左侧筛选侧栏等高。</li>
 *   <li>每 5 秒整体向左步进一组（一组 = 3 张），到末尾无缝回到第 1 组；hover 暂停。</li>
 *   <li>图片底部叠加渐变与「名字 + 头衔」。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 21:10
 */

const CARDS_PER_PAGE = 3;
const STEP_INTERVAL = 5000;
const TRANSITION_MS = 700;

export function TrainerRecommendedScroller({
  initialItems,
}: {
  initialItems?: TrainerListItem[];
}) {
  const [items, setItems] = useState<TrainerListItem[]>(initialItems ?? []);
  const [page, setPage] = useState(0);
  const [enableAnim, setEnableAnim] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // SSR 返回数据不足一页（3 张）时，客户端补取一次
    if (initialItems && initialItems.length >= CARDS_PER_PAGE) return;
    let mounted = true;
    getTopRecommendedTrainers(9)
      .then((list) => mounted && setItems(list))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [initialItems]);

  const total = items.length;
  const totalPages = Math.ceil(total / CARDS_PER_PAGE);
  const enableStep = totalPages > 1;

  useEffect(() => {
    if (!enableStep || paused) return;
    const id = setInterval(() => {
      setEnableAnim(true);
      setPage((p) => p + 1);
    }, STEP_INTERVAL);
    return () => clearInterval(id);
  }, [enableStep, paused]);

  // 走完末尾"补帧"那一组后，瞬时跳回 0（无缝循环）
  useEffect(() => {
    if (!enableStep || page < totalPages) return;
    const t = setTimeout(() => {
      setEnableAnim(false);
      setPage(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableAnim(true));
      });
    }, TRANSITION_MS + 30);
    return () => clearTimeout(t);
  }, [page, totalPages, enableStep]);

  if (total === 0) return null;

  // 末尾补一组首屏内容用于无缝衔接
  const loopItems = enableStep ? [...items, ...items.slice(0, CARDS_PER_PAGE)] : items;

  return (
    <div
      className="relative h-[306px] w-full max-w-[721px] overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${page * 100}%)`,
          transition: enableAnim ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
        }}
      >
        {loopItems.map((t, idx) => {
          const displayName = getTrainerDisplayName(t);
          const subtitle = pickDisplayTitle(t.title, displayName)
            || plainIntroOrUndefined(t.oneLineIntro);
          const isPageEnd = idx % CARDS_PER_PAGE === CARDS_PER_PAGE - 1;
          return (
          <Link
            key={`${t.id}-${idx}`}
            href={`/trainer/${t.id}.htm`}
            className={`shrink-0 w-[227px] cursor-pointer group/item ${isPageEnd ? '' : 'mr-5'}`}
          >
            <div className="relative h-[306px] w-[227px] aspect-[227/306] overflow-hidden rounded-md bg-slate-100">
              <SafeImage
                src={t.avatar}
                alt={displayName}
                fill
                apiResolved
                sizes="(max-width: 1024px) 33vw, 320px"
                className="object-cover object-[center_top] transition-transform duration-500 group-hover/item:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 px-4 pt-12 pb-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-white">
                <h4 className="text-[15px] font-semibold mb-0.5 line-clamp-1">{displayName}</h4>
                {subtitle ? (
                  <p className="text-[12px] opacity-90 line-clamp-2 leading-snug">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
