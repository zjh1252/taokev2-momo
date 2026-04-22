'use client';

import { RotateCcw, X } from 'lucide-react';
import type { TrainerFilterValue } from './TrainerFilters';

/**
 * 已选筛选条件 chip 行，紧贴排序栏上方展示。
 *
 * <p>每个 chip 展示「{标签}: {名称}」，右侧 X 单独移除该项；
 * 行末提供整体「重置」按钮（旋转刷新 icon）。当无任何筛选时整块隐藏。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 18:20
 */
export function TrainerFilterChips({
  value,
  onChange,
  onReset,
}: {
  value: TrainerFilterValue;
  onChange: (v: TrainerFilterValue) => void;
  onReset: () => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (value.expertiseCategoryId && value.expertiseCategoryName) {
    chips.push({
      key: 'expertise',
      label: `擅长领域：${value.expertiseCategoryName}`,
      clear: () => onChange({ ...value, expertiseCategoryId: undefined, expertiseCategoryName: undefined }),
    });
  }
  if (value.industryCategoryId && value.industryCategoryName) {
    chips.push({
      key: 'industry',
      label: `擅长行业：${value.industryCategoryName}`,
      clear: () => onChange({ ...value, industryCategoryId: undefined, industryCategoryName: undefined }),
    });
  }
  if (value.provinceId && value.provinceName) {
    chips.push({
      key: 'province',
      label: `长驻：${value.provinceName}`,
      clear: () => onChange({ ...value, provinceId: undefined, provinceName: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-3 py-2 flex items-center flex-wrap gap-2 text-sm">
      <span className="text-slate-500 mr-1">已选：</span>
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs"
        >
          {c.label}
          <button
            type="button"
            onClick={c.clear}
            className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full cursor-pointer hover:bg-primary/15 transition-colors"
            aria-label="移除该筛选"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 cursor-pointer hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <RotateCcw className="size-3.5" />
        重置
      </button>
    </div>
  );
}
