'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import type { CategoryTreeNode } from '../../api/types';

interface OpenCourseFiltersProps {
  categoryTree: CategoryTreeNode[];
  onFilterChange: (filters: { categoryId?: number }) => void;
}

type FilterKey =
  | 'comprehensive'
  | 'category'
  | 'openCity'
  | 'openTime'
  | 'priceRange'
  | 'courseRating'
  | 'enrollStatus'
  | 'courseExtras';

interface FilterItem {
  key: FilterKey;
  label: string;
  flyoutWidth: number;
}

const FILTER_ITEMS: FilterItem[] = [
  { key: 'comprehensive', label: '综合筛选', flyoutWidth: 400 },
  { key: 'category', label: '课程分类', flyoutWidth: 400 },
  { key: 'openCity', label: '开课省市', flyoutWidth: 400 },
  { key: 'openTime', label: '开课时间', flyoutWidth: 360 },
  { key: 'priceRange', label: '价格范围', flyoutWidth: 320 },
  { key: 'courseRating', label: '课程评价', flyoutWidth: 240 },
  { key: 'enrollStatus', label: '报名状态', flyoutWidth: 200 },
  { key: 'courseExtras', label: '课程配套', flyoutWidth: 260 },
];

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京'];
const TIME_QUICK = ['本周内', '本月内', '近三个月', '周末班', '工作日班'];
const PRICE_RANGES = ['免费', '1000以下', '1000-3000', '3000-5000', '5000以上'];
const RATINGS = [
  { stars: 5, label: '5星好评' },
  { stars: 4, label: '4星及以上' },
  { stars: 3, label: '3星及以上' },
];
const ENROLL_STATUSES = [
  { color: 'bg-emerald-500', label: '正在报名中' },
  { color: 'bg-blue-500', label: '已确认开班' },
  { color: 'bg-orange-500', label: '名额紧张' },
  { color: 'bg-slate-300', label: '报名已结束' },
];
const EXTRAS = ['提供教材', '包含午餐', '课后答疑', '颁发证书', '录播回放', '包住宿'];

export function OpenCourseFilters({ categoryTree, onFilterChange }: OpenCourseFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

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

  const handleCategoryClick = useCallback(
    (catId?: number) => {
      setSelectedCategoryId(catId);
      onFilterChange({ categoryId: catId });
      setActiveFilter(null);
    },
    [onFilterChange],
  );

  const activeItem = FILTER_ITEMS.find((i) => i.key === activeFilter);

  return (
    <div className="w-64 shrink-0 relative" onMouseLeave={handleMouseLeave}>
      {/* 侧边栏 */}
      <aside className="bg-white rounded-xl shadow-sm border border-slate-100">
        {FILTER_ITEMS.map((item, index) => (
          <div
            key={item.key}
            className={index < FILTER_ITEMS.length - 1 ? 'border-b border-slate-100' : ''}
            onMouseEnter={() => handleMouseEnter(item.key)}
          >
            <button
              className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                activeFilter === item.key ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <span className="font-semibold text-slate-800 text-sm">{item.label}</span>
              <ChevronRight
                className={`size-4 transition-colors ${
                  activeFilter === item.key ? 'text-primary' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        ))}
      </aside>

      {/* 右侧浮层面板 */}
      {activeFilter && activeItem && (
        <div
          className="absolute left-full top-0 min-h-full pl-2 z-50"
          onMouseEnter={() => {
            if (leaveTimer.current) {
              clearTimeout(leaveTimer.current);
              leaveTimer.current = null;
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-100 p-6"
            style={{ width: activeItem.flyoutWidth }}
          >
            <FlyoutContent
              filterKey={activeFilter}
              categoryTree={categoryTree}
              selectedCategoryId={selectedCategoryId}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- 浮层内容子组件 ---- */

function FlyoutContent({
  filterKey,
  categoryTree,
  selectedCategoryId,
  onCategoryClick,
}: {
  filterKey: FilterKey;
  categoryTree: CategoryTreeNode[];
  selectedCategoryId?: number;
  onCategoryClick: (id?: number) => void;
}) {
  switch (filterKey) {
    case 'comprehensive':
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {['全部', '最新发布', '最多人看', '评分最高'].map((label) => (
            <button
              key={label}
              className="text-left text-slate-600 hover:text-primary transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      );

    case 'category':
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <button
            onClick={() => onCategoryClick(undefined)}
            className={`text-left transition-colors ${
              !selectedCategoryId ? 'text-primary font-medium' : 'text-slate-600 hover:text-primary'
            }`}
          >
            全部分类
          </button>
          {categoryTree.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className={`text-left transition-colors ${
                selectedCategoryId === cat.id
                  ? 'text-primary font-medium'
                  : 'text-slate-600 hover:text-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      );

    case 'openCity':
      return (
        <div className="grid grid-cols-3 gap-x-4 gap-y-4 text-sm">
          {CITIES.map((city) => (
            <button
              key={city}
              className="text-left text-slate-600 hover:text-primary transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      );

    case 'openTime':
      return (
        <>
          <div className="mb-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3">快捷选择</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {TIME_QUICK.map((label) => (
                <button
                  key={label}
                  className="px-3 py-1.5 rounded bg-slate-50 hover:bg-primary/5 hover:text-primary text-slate-600 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3">自定义时间段</h4>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-primary focus:border-primary outline-none transition-all text-slate-600"
              />
              <span className="text-slate-400 shrink-0">-</span>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-primary focus:border-primary outline-none transition-all text-slate-600"
              />
            </div>
            <button className="w-full mt-4 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-colors">
              确定
            </button>
          </div>
        </>
      );

    case 'priceRange':
      return (
        <>
          <div className="mb-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3">价格区间 (元)</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {PRICE_RANGES.map((label) => (
                <button
                  key={label}
                  className="px-3 py-1.5 rounded bg-slate-50 hover:bg-primary/5 hover:text-primary text-slate-600 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3">自定义价格</h4>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ¥
                </span>
                <input
                  type="number"
                  placeholder="最低价"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 pl-7 pr-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <button className="w-full mt-4 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-colors">
              确定
            </button>
          </div>
        </>
      );

    case 'courseRating':
      return (
        <div className="flex flex-col gap-2 text-sm">
          {RATINGS.map((r) => (
            <button
              key={r.stars}
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors group/item"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < r.stars
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-none text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-slate-500 text-xs group-hover/item:text-primary">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      );

    case 'enrollStatus':
      return (
        <div className="flex flex-col gap-1 text-sm">
          {ENROLL_STATUSES.map((s) => (
            <button
              key={s.label}
              className="px-3 py-2 rounded hover:bg-slate-50 text-slate-600 hover:text-primary transition-colors flex items-center gap-2 text-left"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
              {s.label}
            </button>
          ))}
        </div>
      );

    case 'courseExtras':
      return (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {EXTRAS.map((label) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer group/chk">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-slate-600 group-hover/chk:text-primary text-xs">
                  {label}
                </span>
              </label>
            ))}
          </div>
          <button className="w-full mt-4 bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors">
            筛选配套
          </button>
        </>
      );

    default:
      return null;
  }
}
