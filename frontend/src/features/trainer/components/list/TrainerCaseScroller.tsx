'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Sparkles } from 'lucide-react';
import { getRecentTrainerCases, type RecentTrainerCase } from '../../api/service';

/**
 * 专家列表页「最新案例」步进式滚动条
 *
 * <p>展示规则（与老站对齐）：</p>
 * <ul>
 *   <li>无标题/副标题，每屏 2 条；每条「NEW icon + 案例标题 + 评分」一行布局，无封面图。</li>
 *   <li>每 8 秒整体向上步进 1 行，到末尾无缝回到第 1 行；hover 暂停。</li>
 *   <li>无数据时整块隐藏。点击行跳转到对应专家详情页 {@code ?tab=cases}。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 21:00
 */

const ROW_H = 48; // 单行高度（含上下 padding，与 .h-12 对应）
const ROWS_PER_PAGE = 2; // 每屏 2 条
const PAGE_H = ROW_H * ROWS_PER_PAGE; // 一屏高度
const STEP_INTERVAL = 8000; // 每隔 8 秒整体向上滚动一屏
const TRANSITION_MS = 600;

export function TrainerCaseScroller({
  initialItems,
}: {
  initialItems?: RecentTrainerCase[];
}) {
  const [items, setItems] = useState<RecentTrainerCase[]>(initialItems ?? []);
  const [loaded, setLoaded] = useState(Boolean(initialItems));

  const [page, setPage] = useState(0); // 已步进的虚拟屏数（可超过 totalPages）
  const [enableAnim, setEnableAnim] = useState(true);
  const [paused, setPaused] = useState(false);

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

  const total = items.length;
  // 不足一屏时无需补齐空行（直接展示）；否则按 2 行/屏切换
  const totalPages = Math.ceil(total / ROWS_PER_PAGE);
  const enableStep = totalPages > 1;

  useEffect(() => {
    if (!enableStep || paused) return;
    const id = setInterval(() => {
      setEnableAnim(true);
      setPage((p) => p + 1);
    }, STEP_INTERVAL);
    return () => clearInterval(id);
  }, [enableStep, paused]);

  // 走完最后一屏（含尾部补的首屏副本）后，瞬时跳回 0（无缝循环）
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

  if (!loaded || total === 0) return null;

  // 末尾补上首屏的内容，使最后一屏滚动后能"无缝接"回第一屏
  const loopItems = enableStep ? [...items, ...items.slice(0, ROWS_PER_PAGE)] : items;

  return (
    <div
      className="relative h-24 overflow-hidden bg-white border border-slate-100 rounded-xl shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex flex-col"
        style={{
          transform: `translateY(-${page * PAGE_H}px)`,
          transition: enableAnim ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
        }}
      >
        {loopItems.map((c, idx) => (
          <Link
            key={`${c.id}-${idx}`}
            href={`/trainers/${c.trainerId}?tab=cases`}
            className="h-12 px-4 flex items-center gap-3 border-b border-slate-100 cursor-pointer hover:bg-primary/5 transition-colors group/item"
          >
            <Sparkles className="shrink-0 size-3.5 text-rose-500" />
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
  if (s == null) return '0.00';
  const n = typeof s === 'number' ? s : parseFloat(String(s));
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}
