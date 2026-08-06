'use client';

import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { apiGet } from '@/lib/http/client';
import { DateInput } from '@/components/ui/date-input';
import type { CategoryTreeNode } from '../../api/types';

/**
 * 公开课列表 — 左侧多维筛选侧栏。
 *
 * <p>设计要点：</p>
 * <ul>
 *   <li>鼠标 hover 触发右侧浮层；浮层内所有可点元素显式给出 hover 颜色变化。</li>
 *   <li>「课程分类」「开课省市」均支持多选，点击即生效（再次点击取消）。</li>
 *   <li>「开课时间」支持快捷段 + 自定义日期；「价格区间」支持预设档 + 自定义。</li>
 *   <li>排序逻辑由顶部排序栏负责，本侧栏不再提供「综合筛选」入口。</li>
 *   <li>「开课省市」从 {@code GET /regions/children} 拉取省份列表。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 23:10
 */

/** 公开课列表所有可过滤维度（与 CourseListParams 子集对齐） */
export interface OpenCourseFilterValue {
  /** 一级课程分类 IDs（多选） */
  categoryIds?: number[];
  /** 多选展示文字（与 categoryIds 一一对应） */
  categoryNames?: string[];

  /** 开课省份 IDs（多选） */
  provinceIds?: number[];
  /** 多选展示文字（与 provinceIds 一一对应） */
  provinceNames?: string[];

  /** 开课时间快捷段 key（thisWeek/thisMonth/nextThreeMonths） */
  timeQuick?: string;
  timeQuickLabel?: string;
  /** 自定义开课时间起止（YYYY-MM-DD） */
  startTimeFrom?: string;
  startTimeTo?: string;

  /** 价格预设档 label（用于 chips 展示） */
  priceLabel?: string;
  priceMin?: number;
  priceMax?: number;
  isFree?: number;
}

interface OpenCourseFiltersProps {
  categoryTree: CategoryTreeNode[];
  value: OpenCourseFilterValue;
  onChange: (value: OpenCourseFilterValue) => void;
}

type FilterKey = 'category' | 'openCity' | 'openTime' | 'priceRange';

interface FilterMeta {
  key: FilterKey;
  label: string;
  flyoutWidth: number;
}

const FILTER_ITEMS: FilterMeta[] = [
  { key: 'category', label: '课程分类', flyoutWidth: 420 },
  { key: 'openCity', label: '开课省市', flyoutWidth: 540 },
  { key: 'openTime', label: '开课时间', flyoutWidth: 360 },
  { key: 'priceRange', label: '价格范围', flyoutWidth: 340 },
];

/** 时间快捷段：与后端 PublicCourseQuery.timeQuick 解析对齐 */
const TIME_QUICK_OPTIONS: { label: string; key: string }[] = [
  { label: '本周内', key: 'thisWeek' },
  { label: '本月内', key: 'thisMonth' },
  { label: '近三个月', key: 'nextThreeMonths' },
];

/** 价格档预设 */
const PRICE_PRESETS: {
  label: string;
  isFree?: number;
  priceMin?: number;
  priceMax?: number;
}[] = [
  { label: '免费', isFree: 1 },
  { label: '1000以下', priceMax: 1000 },
  { label: '1000-3000', priceMin: 1000, priceMax: 3000 },
  { label: '3000-5000', priceMin: 3000, priceMax: 5000 },
  { label: '5000以上', priceMin: 5000 },
];

interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

async function fetchProvinces(): Promise<RegionItem[]> {
  const res = await apiGet<{ data: RegionItem[] }>(`/regions/children`);
  return res.data || [];
}

export function OpenCourseFilters({ categoryTree, value, onChange }: OpenCourseFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [provinces, setProvinces] = useState<RegionItem[]>([]);

  const [customStart, setCustomStart] = useState(value.startTimeFrom || '');
  const [customEnd, setCustomEnd] = useState(value.startTimeTo || '');
  const [customPriceMin, setCustomPriceMin] = useState<string>(
    value.priceMin?.toString() ?? '',
  );
  const [customPriceMax, setCustomPriceMax] = useState<string>(
    value.priceMax?.toString() ?? '',
  );
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch(() => {});
  }, []);

  const handleMouseEnter = useCallback((key: FilterKey) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setActiveFilter(key);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      setActiveFilter(null);
    }, 80);
  }, []);

  const closeFlyout = () => setActiveFilter(null);

  const patch = (p: Partial<OpenCourseFilterValue>) => onChange({ ...value, ...p });

  /**
   * 通用切换：在已选 ids 中翻转 id；同步重新计算 names。
   * <p>不关闭浮层，方便用户连续多选。</p>
   */
  const toggleMultiSelect = (
    field: 'categoryIds' | 'provinceIds',
    nameField: 'categoryNames' | 'provinceNames',
    id: number,
    nameLookup: (id: number) => string | undefined,
  ) => {
    const currentIds = (value[field] as number[] | undefined) ?? [];
    const idx = currentIds.indexOf(id);
    let nextIds: number[];
    if (idx >= 0) {
      nextIds = currentIds.filter((x) => x !== id);
    } else {
      nextIds = [...currentIds, id];
    }
    const nextNames = nextIds
      .map((nid) => nameLookup(nid))
      .filter((n): n is string => Boolean(n));
    patch({
      [field]: nextIds.length > 0 ? nextIds : undefined,
      [nameField]: nextNames.length > 0 ? nextNames : undefined,
    } as Partial<OpenCourseFilterValue>);
  };

  const toggleCategory = (id: number) =>
    toggleMultiSelect('categoryIds', 'categoryNames', id, (nid) =>
      categoryTree.find((c) => c.id === nid)?.name,
    );

  const toggleProvince = (id: number) =>
    toggleMultiSelect('provinceIds', 'provinceNames', id, (nid) =>
      provinces.find((p) => p.id === nid)?.name,
    );

  const handleTimeQuick = (key: string, label: string) => {
    patch({
      timeQuick: key,
      timeQuickLabel: label,
      startTimeFrom: undefined,
      startTimeTo: undefined,
    });
    setCustomStart('');
    setCustomEnd('');
    closeFlyout();
  };

  const handleCustomTimeApply = () => {
    if (!customStart && !customEnd) return;
    patch({
      timeQuick: undefined,
      timeQuickLabel: undefined,
      startTimeFrom: customStart || undefined,
      startTimeTo: customEnd || undefined,
    });
    closeFlyout();
  };

  const handlePricePreset = (preset: (typeof PRICE_PRESETS)[number]) => {
    patch({
      priceLabel: preset.label,
      priceMin: preset.priceMin,
      priceMax: preset.priceMax,
      isFree: preset.isFree,
    });
    setCustomPriceMin(preset.priceMin?.toString() ?? '');
    setCustomPriceMax(preset.priceMax?.toString() ?? '');
    closeFlyout();
  };

  const handleCustomPriceApply = () => {
    const min = customPriceMin ? Number(customPriceMin) : undefined;
    const max = customPriceMax ? Number(customPriceMax) : undefined;
    if (min === undefined && max === undefined) return;
    if (min !== undefined && Number.isNaN(min)) return;
    if (max !== undefined && Number.isNaN(max)) return;
    const label = `${min ?? '不限'}-${max ?? '不限'}`;
    patch({ priceLabel: label, priceMin: min, priceMax: max, isFree: undefined });
    closeFlyout();
  };

  const activeMeta = FILTER_ITEMS.find((f) => f.key === activeFilter);

  return (
    <div className="w-full shrink-0 relative" onMouseLeave={handleMouseLeave}>
      <aside className="bg-white rounded-xl shadow-sm border border-slate-100">
        {FILTER_ITEMS.map((item, index) => (
          <div
            key={item.key}
            className={index < FILTER_ITEMS.length - 1 ? 'border-b border-slate-100' : ''}
            onMouseEnter={() => handleMouseEnter(item.key)}
          >
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === item.key ? null : item.key)}
              className={`w-full flex items-center justify-between p-4 text-left cursor-pointer transition-colors ${
                activeFilter === item.key ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <span className="font-semibold text-slate-800 text-sm">
                {item.label}
              </span>
              <ChevronRight
                className={`size-4 transition-colors ${
                  activeFilter === item.key ? 'text-primary' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        ))}
      </aside>

      {activeFilter && activeMeta && (
        <div
          className="absolute left-0 top-full z-50 w-full pt-2 lg:left-full lg:top-0 lg:min-h-full lg:w-auto lg:pl-2 lg:pt-0"
          onMouseEnter={() => {
            if (leaveTimer.current) {
              clearTimeout(leaveTimer.current);
              leaveTimer.current = null;
            }
          }}
        >
          <div
            className="max-h-[70vh] w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-4 shadow-xl lg:w-[var(--flyout-width)] lg:p-6"
            style={{ '--flyout-width': `${activeMeta.flyoutWidth}px` } as CSSProperties}
          >
            {activeFilter === 'category' && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {categoryTree.map((cat) => {
                  const checked = (value.categoryIds ?? []).includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2 text-left cursor-pointer transition-colors px-1.5 py-1 rounded ${
                        checked
                          ? 'text-primary font-medium bg-primary/5'
                          : 'text-slate-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
                          checked
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeFilter === 'openCity' && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm sm:grid-cols-4">
                {provinces.map((p) => {
                  const checked = (value.provinceIds ?? []).includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProvince(p.id)}
                      className={`flex items-center gap-2 text-left cursor-pointer transition-colors px-1.5 py-1 rounded ${
                        checked
                          ? 'text-primary font-medium bg-primary/5'
                          : 'text-slate-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
                          checked
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeFilter === 'openTime' && (
              <>
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">快捷选择</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {TIME_QUICK_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleTimeQuick(opt.key, opt.label)}
                        className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                          value.timeQuick === opt.key
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'bg-slate-50 text-slate-600 hover:bg-primary/5 hover:text-primary border border-transparent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">自定义时间段</h4>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <DateInput
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      placeholderClassName="text-xs"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-primary focus:border-primary outline-none transition-all text-slate-600 cursor-pointer"
                    />
                    <span className="text-slate-400 shrink-0">-</span>
                    <DateInput
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      placeholderClassName="text-xs"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-primary focus:border-primary outline-none transition-all text-slate-600 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomTimeApply}
                    className="w-full mt-4 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-colors cursor-pointer"
                  >
                    确定
                  </button>
                </div>
              </>
            )}

            {activeFilter === 'priceRange' && (
              <>
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">价格区间 (元)</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {PRICE_PRESETS.map((preset) => {
                      const active = value.priceLabel === preset.label;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handlePricePreset(preset)}
                          className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-slate-50 text-slate-600 hover:bg-primary/5 hover:text-primary border border-transparent'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">自定义价格</h4>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        ¥
                      </span>
                      <input
                        type="number"
                        placeholder="最低价"
                        value={customPriceMin}
                        onChange={(e) => setCustomPriceMin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 pl-7 pr-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <span className="text-slate-400 shrink-0">-</span>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        ¥
                      </span>
                      <input
                        type="number"
                        placeholder="最高价"
                        value={customPriceMax}
                        onChange={(e) => setCustomPriceMax(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 pl-7 pr-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomPriceApply}
                    className="w-full mt-4 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-colors cursor-pointer"
                  >
                    确定
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

