'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { getTopRecommendedTrainers } from '../../api/service';
import type { TrainerListItem } from '../../types';
import { pickRecommendedTrainerSubtitle } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';
import {
  TRAINER_RECOMMENDED_CARD_ASPECT,
  TRAINER_RECOMMENDED_CARD_HEIGHT,
  TRAINER_RECOMMENDED_CARD_WIDTH,
  TRAINER_RECOMMENDED_CARDS_PER_PAGE,
  TRAINER_RECOMMENDED_SCROLLER_MAX_WIDTH,
} from '../../constants/recommended-scroller-layout';

/**
 * 专家列表页右上角「推荐位」步进式滚动条
 *
 * <p>展示规则（与老站 tkw/ 对齐）：</p>
 * <ul>
 *   <li>桌面：单卡固定 227×306；四人一组时只加宽容器，不压缩单卡。</li>
 *   <li>移动端：每屏 1 卡、宽度跟随容器，避免固定宽撑开页面横向滚动。</li>
 *   <li>每 5 秒整体向左步进一组，到末尾无缝回到第 1 组；hover 暂停。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 21:10
 */

const STEP_INTERVAL = 5000;
const TRANSITION_MS = 700;
const LG_MQ = '(min-width: 1024px)';

function subscribeLg(onStoreChange: () => void) {
  const mq = window.matchMedia(LG_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getLgCardsPerPage() {
  return window.matchMedia(LG_MQ).matches
    ? TRAINER_RECOMMENDED_CARDS_PER_PAGE
    : 1;
}

/** SSR 按移动端 1 卡，避免首屏固定宽撑破视口 */
function getServerCardsPerPage() {
  return 1;
}

export function TrainerRecommendedScroller({
  initialItems,
}: {
  initialItems?: TrainerListItem[];
}) {
  const cardsPerPage = useSyncExternalStore(
    subscribeLg,
    getLgCardsPerPage,
    getServerCardsPerPage,
  );
  const [items, setItems] = useState<TrainerListItem[]>(initialItems ?? []);
  const [page, setPage] = useState(0);
  const [enableAnim, setEnableAnim] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (initialItems && initialItems.length >= TRAINER_RECOMMENDED_CARDS_PER_PAGE) return;
    let mounted = true;
    getTopRecommendedTrainers(12)
      .then((list) => mounted && setItems(list))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [initialItems]);

  useEffect(() => {
    setPage(0);
  }, [cardsPerPage]);

  const total = items.length;
  const totalPages = Math.ceil(total / cardsPerPage);
  const enableStep = totalPages > 1;

  useEffect(() => {
    if (!enableStep || paused) return;
    const id = setInterval(() => {
      setEnableAnim(true);
      setPage((p) => p + 1);
    }, STEP_INTERVAL);
    return () => clearInterval(id);
  }, [enableStep, paused]);

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

  const loopItems = enableStep ? [...items, ...items.slice(0, cardsPerPage)] : items;
  const isMobileSingle = cardsPerPage === 1;

  return (
    <div
      className="relative w-full min-w-0 max-w-full overflow-hidden rounded-xl"
      style={{
        height: isMobileSingle ? undefined : TRAINER_RECOMMENDED_CARD_HEIGHT,
        aspectRatio: isMobileSingle ? TRAINER_RECOMMENDED_CARD_ASPECT : undefined,
        maxWidth: isMobileSingle ? '100%' : TRAINER_RECOMMENDED_SCROLLER_MAX_WIDTH,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full min-w-0"
        style={{
          transform: `translateX(-${page * 100}%)`,
          transition: enableAnim ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
        }}
      >
        {loopItems.map((t, idx) => {
          const displayName = getTrainerDisplayName(t);
          const subtitle = pickRecommendedTrainerSubtitle(t.title, t.oneLineIntro, displayName);
          const isPageEnd = idx % cardsPerPage === cardsPerPage - 1;
          return (
            <Link
              key={`${t.id}-${idx}`}
              href={`/trainer/${t.id}.htm`}
              className={`min-w-0 shrink-0 cursor-pointer group/item ${
                isMobileSingle ? 'w-full' : ''
              } ${!isMobileSingle && !isPageEnd ? 'mr-5' : ''}`}
              style={
                isMobileSingle
                  ? undefined
                  : { width: TRAINER_RECOMMENDED_CARD_WIDTH }
              }
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-md bg-slate-100"
                style={
                  isMobileSingle
                    ? undefined
                    : {
                        width: TRAINER_RECOMMENDED_CARD_WIDTH,
                        height: TRAINER_RECOMMENDED_CARD_HEIGHT,
                        aspectRatio: TRAINER_RECOMMENDED_CARD_ASPECT,
                      }
                }
              >
                <SafeImage
                  src={t.avatar}
                  fallback={t.avatarFallback || undefined}
                  alt={displayName}
                  fill
                  apiResolved
                  sizes="(max-width: 1024px) 100vw, 227px"
                  className="object-cover object-[center_top] transition-transform duration-500 group-hover/item:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-3 pt-12 text-white">
                  <h4 className="mb-0.5 line-clamp-1 text-[15px] font-semibold">{displayName}</h4>
                  {subtitle ? (
                    <p className="line-clamp-2 text-[12px] leading-snug opacity-90">{subtitle}</p>
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
