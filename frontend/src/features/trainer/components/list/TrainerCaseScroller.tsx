'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Sparkles } from 'lucide-react';
import { getRecentTrainerCases, type RecentTrainerCase } from '../../api/service';

/**
 * 专家列表页「最新案例」滚动条
 *
 * <p>展示规则：</p>
 * <ul>
 *   <li>整块只占 1 行高，单行内并排显示 2 条案例。</li>
 *   <li>每 8 秒整体向上步进一行，到末尾无缝回到第 1 行；hover 暂停。</li>
 *   <li>每条只显示「主色 NEW icon + 案例标题 + 整数评分」。</li>
 *   <li>无数据时整块隐藏。点击行跳转到对应专家详情页授课案例 Tab。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 22:00
 */

const ROW_H = 48;
const COLS = 2;
const STEP_INTERVAL = 8000;
const TRANSITION_MS = 600;

export function TrainerCaseScroller({
  initialItems,
}: {
  initialItems?: RecentTrainerCase[];
}) {
  const [items, setItems] = useState<RecentTrainerCase[]>(initialItems ?? []);
  const [loaded, setLoaded] = useState(Boolean(initialItems));

  const [row, setRow] = useState(0);
  const [enableAnim, setEnableAnim] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    getRecentTrainerCases(10)
      .then((list) => {
        if (!mounted) return;
        if (list.length > 0) {
          setItems(list);
        }
        setLoaded(true);
      })
      .catch(() => mounted && setLoaded(true));
    return () => {
      mounted = false;
    };
  }, []);

  // 把 items 切成 [[a,b],[c,d],...] 的二维行；不足 COLS 的最后一行用 null 占位
  const rows: (RecentTrainerCase | null)[][] = [];
  for (let i = 0; i < items.length; i += COLS) {
    const slice: (RecentTrainerCase | null)[] = items.slice(i, i + COLS);
    while (slice.length < COLS) slice.push(null);
    rows.push(slice);
  }

  const totalRows = rows.length;
  const enableStep = totalRows > 1;

  useEffect(() => {
    if (!enableStep || paused) return;
    const id = setInterval(() => {
      setEnableAnim(true);
      setRow((r) => r + 1);
    }, STEP_INTERVAL);
    return () => clearInterval(id);
  }, [enableStep, paused]);

  // 走到末尾「补帧」那一行后，瞬时跳回 0（无缝循环）
  useEffect(() => {
    if (!enableStep || row < totalRows) return;
    const t = setTimeout(() => {
      setEnableAnim(false);
      setRow(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableAnim(true));
      });
    }, TRANSITION_MS + 30);
    return () => clearTimeout(t);
  }, [row, totalRows, enableStep]);

  if (!loaded || items.length === 0) return null;

  // 末尾补 1 行首屏内容用于无缝衔接
  const loopRows = enableStep ? [...rows, rows[0]] : rows;

  return (
    <div
      className="relative h-12 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex flex-col"
        style={{
          transform: `translateY(-${row * ROW_H}px)`,
          transition: enableAnim ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
        }}
      >
        {loopRows.map((cells, rowIdx) => (
          <div key={rowIdx} className="h-12 flex items-stretch gap-4">
            {cells.map((c, colIdx) =>
              c ? (
                <Link
                  key={`${c.id}-${colIdx}`}
                  href={`/case/${c.id}.htm`}
                  className="flex-1 min-w-0 px-4 flex items-center gap-3 cursor-pointer bg-white border border-slate-100 rounded-xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all group/item"
                >
                  <Sparkles className="shrink-0 size-3.5 text-primary" />
                  <span className="flex-1 min-w-0 text-[14px] text-slate-800 line-clamp-1 group-hover/item:text-primary transition-colors">
                    {c.caseTitle}
                  </span>
                  {formatScore(c) ? (
                    <span className="shrink-0 text-[13px] font-semibold text-rose-500">
                      {formatScore(c)}分
                    </span>
                  ) : null}
                </Link>
              ) : (
                <div key={`empty-${colIdx}`} className="flex-1" />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatScore(c: RecentTrainerCase): string | null {
  // 评分按整数展示；无有效评分时不展示，避免推荐位缺字段时刷「0分」
  const s = c.trainerScore;
  if (s == null) return null;
  const n = typeof s === 'number' ? s : parseFloat(String(s));
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.round(n));
}
