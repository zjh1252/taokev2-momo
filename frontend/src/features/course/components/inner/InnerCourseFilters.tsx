'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CategoryTreeNode } from '../../api/types';

interface InnerCourseFiltersProps {
  categoryTree: CategoryTreeNode[];
  onFilterChange: (filters: { categoryId?: number }) => void;
}

export function InnerCourseFilters({ categoryTree, onFilterChange }: InnerCourseFiltersProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();

  const filterItems = [
    { key: 'all', label: '综合类' },
    { key: 'category', label: '课程分类' },
    { key: 'city', label: '讲师城市' },
    { key: 'industry', label: '课程行业' },
    { key: 'exclusive', label: '讲师独家' },
  ];

  const handleCategoryClick = (catId?: number) => {
    setSelectedCategoryId(catId);
    onFilterChange({ categoryId: catId });
    setExpandedFilter(null);
  };

  return (
    <div className="w-64 shrink-0 space-y-1">
      {filterItems.map((item) => (
        <div key={item.key} className="relative">
          <button
            onClick={() => {
              if (item.key === 'all') {
                handleCategoryClick(undefined);
                return;
              }
              setExpandedFilter(expandedFilter === item.key ? null : item.key);
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

          {/* TODO: 其他筛选项暂未实现 */}
        </div>
      ))}
    </div>
  );
}
