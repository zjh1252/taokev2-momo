'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CategoryTreeNode } from '../../api/types';

interface InnerCourseFiltersProps {
  categoryTree: CategoryTreeNode[];
  onFilterChange: (filters: { categoryId?: number }) => void;
}

type FilterKey = 'comprehensive' | 'category' | 'trainerCity' | 'industry' | 'exclusive';

interface FilterItem {
  key: FilterKey;
  label: string;
  flyoutWidth: number;
}

const FILTER_ITEMS: FilterItem[] = [
  { key: 'comprehensive', label: '综合类', flyoutWidth: 400 },
  { key: 'category', label: '课程分类', flyoutWidth: 400 },
  { key: 'trainerCity', label: '讲师城市', flyoutWidth: 400 },
  { key: 'industry', label: '课程行业', flyoutWidth: 400 },
  { key: 'exclusive', label: '讲师独家', flyoutWidth: 240 },
];

const CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都',
  '武汉', '南京', '苏州', '天津', '重庆', '西安',
];
const INDUSTRIES = [
  '互联网/IT', '金融', '制造业', '房地产', '医药/医疗',
  '零售/电商', '教育', '能源', '汽车', '快消品',
];

export function InnerCourseFilters({ categoryTree, onFilterChange }: InnerCourseFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = useCallback((key: FilterKey) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = undefined;
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
              leaveTimer.current = undefined;
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
          {['全部', '最新发布', '人气最高', '评分最高'].map((label) => (
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

    case 'trainerCity':
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

    case 'industry':
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              className="text-left text-slate-600 hover:text-primary transition-colors"
            >
              {ind}
            </button>
          ))}
        </div>
      );

    case 'exclusive':
      return (
        <div className="flex flex-col gap-1 text-sm">
          {['全部讲师', '独家讲师', '平台认证'].map((label) => (
            <button
              key={label}
              className="px-3 py-2 rounded text-left text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      );

    default:
      return null;
  }
}
