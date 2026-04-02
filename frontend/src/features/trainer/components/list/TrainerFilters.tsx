'use client';

import { useState, useCallback } from 'react';
import type { CategoryTreeNode } from '../../types';

interface TrainerFiltersProps {
  expertiseTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
  initialFilters?: {
    expertiseCategoryId?: number;
    industryCategoryId?: number;
    sort?: string;
  };
  onFilterChange: (filters: {
    expertiseCategoryId?: number;
    industryCategoryId?: number;
    sort?: string;
  }) => void;
}

export function TrainerFilters({
  expertiseTree,
  industryTree,
  initialFilters = {},
  onFilterChange,
}: TrainerFiltersProps) {
  const [expertiseId, setExpertiseId] = useState<number | undefined>(
    initialFilters.expertiseCategoryId,
  );
  const [industryId, setIndustryId] = useState<number | undefined>(
    initialFilters.industryCategoryId,
  );
  const [sort, setSort] = useState(initialFilters.sort || 'default');

  const handleExpertise = useCallback(
    (id?: number) => {
      setExpertiseId(id);
      onFilterChange({ expertiseCategoryId: id, industryCategoryId: industryId, sort });
    },
    [industryId, sort, onFilterChange],
  );

  const handleIndustry = useCallback(
    (id?: number) => {
      setIndustryId(id);
      onFilterChange({ expertiseCategoryId: expertiseId, industryCategoryId: id, sort });
    },
    [expertiseId, sort, onFilterChange],
  );

  const handleSort = useCallback(
    (s: string) => {
      setSort(s);
      onFilterChange({ expertiseCategoryId: expertiseId, industryCategoryId: industryId, sort: s });
    },
    [expertiseId, industryId, onFilterChange],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      {/* 擅长领域 */}
      {expertiseTree.length > 0 && (
        <FilterRow label="擅长领域">
          <FilterPill active={!expertiseId} onClick={() => handleExpertise(undefined)}>
            不限
          </FilterPill>
          {expertiseTree.map((node) => (
            <FilterPill
              key={node.id}
              active={expertiseId === node.id}
              onClick={() => handleExpertise(node.id)}
            >
              {node.name}
            </FilterPill>
          ))}
        </FilterRow>
      )}

      {/* 擅长行业 */}
      {industryTree.length > 0 && (
        <FilterRow label="擅长行业">
          <FilterPill active={!industryId} onClick={() => handleIndustry(undefined)}>
            不限
          </FilterPill>
          {industryTree.map((node) => (
            <FilterPill
              key={node.id}
              active={industryId === node.id}
              onClick={() => handleIndustry(node.id)}
            >
              {node.name}
            </FilterPill>
          ))}
        </FilterRow>
      )}

      {/* 排序 */}
      <FilterRow label="排序">
        <FilterPill active={sort === 'default'} onClick={() => handleSort('default')}>
          综合排序
        </FilterPill>
        <FilterPill active={sort === 'score'} onClick={() => handleSort('score')}>
          好评率
        </FilterPill>
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 text-[14px]">
      <span className="text-slate-500 w-[70px] shrink-0 pt-1.5 font-medium">{label}</span>
      <div className="flex flex-wrap gap-2 flex-1">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[13px] transition-colors ${
        active
          ? 'bg-primary/10 text-primary border border-primary/20 font-medium'
          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
