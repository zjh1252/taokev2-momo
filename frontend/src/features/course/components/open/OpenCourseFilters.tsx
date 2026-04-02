'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CategoryTreeNode } from '../../api/types';

interface OpenCourseFiltersProps {
  categoryTree: CategoryTreeNode[];
  onFilterChange: (filters: { categoryId?: number }) => void;
}

const FILTER_ITEMS = [
  { key: 'comprehensive', label: '综合筛选' },
  { key: 'category', label: '课程分类' },
  { key: 'openCity', label: '开课省市' },
  { key: 'openTime', label: '开课时间' },
  { key: 'priceRange', label: '价格范围' },
  { key: 'courseRating', label: '课程评价' },
  { key: 'enrollStatus', label: '报名状态' },
  { key: 'courseExtras', label: '课程配套' },
];

export function OpenCourseFilters({ categoryTree, onFilterChange }: OpenCourseFiltersProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();

  const handleCategoryClick = (catId?: number) => {
    setSelectedCategoryId(catId);
    onFilterChange({ categoryId: catId });
    setExpandedFilter(null);
  };

  return (
    <div className="w-64 shrink-0 space-y-1">
      {FILTER_ITEMS.map((item) => (
        <div key={item.key} className="relative group">
          <button
            onClick={() => {
              if (item.key === 'comprehensive') {
                handleCategoryClick(undefined);
                return;
              }
              if (item.key === 'category') {
                setExpandedFilter(expandedFilter === item.key ? null : item.key);
                return;
              }
              // TODO: 其他筛选项暂未实现
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              expandedFilter === item.key
                ? 'bg-primary text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {item.label}
            <ChevronRight className="size-4" />
          </button>

          {/* 课程分类展开面板 */}
          {expandedFilter === 'category' && item.key === 'category' && categoryTree.length > 0 && (
            <div className="mt-1 bg-white border border-slate-100 rounded-lg p-3 space-y-1">
              <button
                onClick={() => handleCategoryClick(undefined)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  !selectedCategoryId ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                全部
              </button>
              {categoryTree.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedCategoryId === cat.id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
