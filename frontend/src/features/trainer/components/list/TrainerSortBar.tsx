'use client';

import { ArrowUpDown, RotateCcw, X } from 'lucide-react';
import type { TrainerFilterValue } from './TrainerFilters';

/**
 * 专家列表排序栏 — 综合排序 / 好评率
 *
 * @author Fangxinxin
 * @date 2026-04-22 21:30
 */

const SORT_OPTIONS = [
  { key: 'default', label: '综合排序' },
  { key: 'score', label: '好评率' },
];

export function TrainerSortBar({
  sort,
  total,
  filters,
  onChange,
  onFilterChange,
  onReset,
}: {
  sort: string;
  total: number;
  filters: TrainerFilterValue;
  onChange: (sort: string) => void;
  onFilterChange: (value: TrainerFilterValue) => void;
  onReset: () => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.fieldParentName) {
    const label = filters.fieldChildName
      ? `擅长领域：${filters.fieldParentName} / ${filters.fieldChildName}`
      : `擅长领域：${filters.fieldParentName}`;
    chips.push({
      key: 'field',
      label,
      clear: () =>
        onFilterChange({
          ...filters,
          fieldParentName: undefined,
          fieldChildName: undefined,
          expertiseCategoryId: undefined,
        }),
    });
  }
  if (filters.industryName) {
    chips.push({
      key: 'industry',
      label: `擅长行业：${filters.industryName}`,
      clear: () =>
        onFilterChange({
          ...filters,
          industryName: undefined,
          industryCategoryId: undefined,
        }),
    });
  }
  if (filters.regionName) {
    chips.push({
      key: 'region',
      label: `常驻城市：${filters.regionName}`,
      clear: () =>
        onFilterChange({
          ...filters,
          regionName: undefined,
          provinceId: undefined,
        }),
    });
  }
  if (filters.trustedOnly) {
    chips.push({
      key: 'trusted',
      label: '信得过',
      clear: () => onFilterChange({ ...filters, trustedOnly: false }),
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center flex-wrap gap-2">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-6 py-2 rounded-lg text-sm cursor-pointer transition-colors inline-flex items-center gap-1 ${
            sort === opt.key
              ? 'font-bold text-primary bg-primary/5'
              : 'font-medium text-slate-600 hover:bg-slate-50'
          }`}
        >
          {opt.label}
          <ArrowUpDown className="size-3.5" />
        </button>
      ))}

      {chips.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 ml-4 pl-4 border-l border-slate-200">
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
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 cursor-pointer hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <RotateCcw className="size-3.5" />
            重置
          </button>
        </div>
      )}

      <span className="ml-auto text-sm text-slate-500 pr-2">
        共 <strong className="text-slate-900">{total}</strong> 位专家
      </span>
    </div>
  );
}
