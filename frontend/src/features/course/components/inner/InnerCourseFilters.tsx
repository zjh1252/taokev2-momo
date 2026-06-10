'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiGet } from '@/lib/http/client';
import type { CategoryTreeNode } from '../../api/types';

/**
 * 内训课列表 — 左侧筛选侧栏（与专家/公开课列表交互对齐）
 */
export interface InnerCourseFilterValue {
  /** 课程分类（一级或二级节点 ID） */
  categoryId?: number;
  categoryName?: string;
  /** 主讲专家擅长行业 */
  industryCategoryId?: number;
  industryCategoryName?: string;
  /** 主讲专家省份 */
  trainerProvinceId?: number;
  trainerProvinceName?: string;
  /** 综合类排序：default / time / viewCount / score */
  sortBy?: string;
  sortLabel?: string;
  /** 独家讲师（有版权课） */
  trainerHasCopyright?: boolean;
  /** 平台认证（信得过） */
  trainerTrusted?: boolean;
}

interface InnerCourseFiltersProps {
  categoryTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
  value: InnerCourseFilterValue;
  onChange: (value: InnerCourseFilterValue) => void;
}

type FilterKey = 'comprehensive' | 'category' | 'trainerCity' | 'industry' | 'exclusive';

interface FilterMeta {
  key: FilterKey;
  label: string;
  flyoutWidth: number;
}

const FILTER_ITEMS: FilterMeta[] = [
  { key: 'comprehensive', label: '综合类', flyoutWidth: 400 },
  { key: 'category', label: '课程分类', flyoutWidth: 520 },
  { key: 'trainerCity', label: '讲师城市', flyoutWidth: 520 },
  { key: 'industry', label: '课程行业', flyoutWidth: 520 },
  { key: 'exclusive', label: '讲师独家', flyoutWidth: 240 },
];

const COMPREHENSIVE_OPTIONS: { label: string; sortBy?: string }[] = [
  { label: '全部', sortBy: undefined },
  { label: '最新发布', sortBy: 'time' },
  { label: '人气最高', sortBy: 'viewCount' },
  { label: '评分最高', sortBy: 'score' },
];

interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

async function fetchProvinces(): Promise<RegionItem[]> {
  const res = await apiGet<{ data: RegionItem[] }>('/regions/children');
  return res.data || [];
}

export function InnerCourseFilters({
  categoryTree,
  industryTree,
  value,
  onChange,
}: InnerCourseFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
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

  const patch = (p: Partial<InnerCourseFilterValue>) => onChange({ ...value, ...p });

  const handleCategory = (id?: number, name?: string) => {
    patch({ categoryId: id, categoryName: name });
    closeFlyout();
  };

  const handleIndustry = (id?: number, name?: string) => {
    patch({ industryCategoryId: id, industryCategoryName: name });
    closeFlyout();
  };

  const handleProvince = (id?: number, name?: string) => {
    patch({ trainerProvinceId: id, trainerProvinceName: name });
    closeFlyout();
  };

  const handleComprehensive = (label: string, sortBy?: string) => {
    patch({ sortBy, sortLabel: sortBy ? label : undefined });
    closeFlyout();
  };

  const handleExclusive = (mode: 'all' | 'copyright' | 'trusted') => {
    if (mode === 'all') {
      patch({ trainerHasCopyright: undefined, trainerTrusted: undefined });
    } else if (mode === 'copyright') {
      patch({ trainerHasCopyright: true, trainerTrusted: undefined });
    } else {
      patch({ trainerHasCopyright: undefined, trainerTrusted: true });
    }
    closeFlyout();
  };

  const activeMeta = FILTER_ITEMS.find((f) => f.key === activeFilter);

  return (
    <div
      className="w-64 shrink-0 relative"
      onMouseLeave={handleMouseLeave}
    >
      <aside className="bg-white rounded-xl shadow-sm border border-slate-100">
        {FILTER_ITEMS.map((item) => (
          <div
            key={item.key}
            className="border-b border-slate-100"
            onMouseEnter={() => handleMouseEnter(item.key)}
          >
            <button
              type="button"
              className={`w-full flex items-center justify-between p-4 text-left cursor-pointer transition-colors ${
                activeFilter === item.key ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-start min-w-0">
                <span className="font-semibold text-slate-800 text-sm">{item.label}</span>
                {pickSelectedLabel(item.key, value) && (
                  <span className="text-xs text-primary mt-0.5 truncate max-w-[170px]">
                    {pickSelectedLabel(item.key, value)}
                  </span>
                )}
              </div>
              <ChevronRight
                className={`size-4 transition-colors shrink-0 ${
                  activeFilter === item.key ? 'text-primary' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        ))}
      </aside>

      {activeFilter && activeMeta && (
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
            className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 max-h-[70vh] overflow-y-auto"
            style={{ width: activeMeta.flyoutWidth }}
          >
            {activeFilter === 'comprehensive' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {COMPREHENSIVE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleComprehensive(opt.label, opt.sortBy)}
                    className={`text-left cursor-pointer transition-colors ${
                      (opt.sortBy ?? 'default') === (value.sortBy ?? 'default')
                        ? 'text-primary font-medium'
                        : 'text-slate-600 hover:text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            {activeFilter === 'category' && (
              <CategoryTwoLevelPanel
                tree={categoryTree}
                selectedId={value.categoryId}
                onPick={handleCategory}
              />
            )}
            {activeFilter === 'trainerCity' && (
              <ProvincePanel
                provinces={provinces}
                selectedId={value.trainerProvinceId}
                onPick={handleProvince}
              />
            )}
            {activeFilter === 'industry' && (
              <CategoryTwoLevelPanel
                tree={industryTree}
                selectedId={value.industryCategoryId}
                onPick={handleIndustry}
              />
            )}
            {activeFilter === 'exclusive' && (
              <div className="flex flex-col gap-1 text-sm">
                {[
                  { label: '全部讲师', mode: 'all' as const },
                  { label: '独家讲师', mode: 'copyright' as const },
                  { label: '平台认证', mode: 'trusted' as const },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleExclusive(opt.mode)}
                    className={`px-3 py-2 rounded text-left cursor-pointer transition-colors ${
                      (opt.mode === 'all' && !value.trainerHasCopyright && !value.trainerTrusted)
                      || (opt.mode === 'copyright' && value.trainerHasCopyright)
                      || (opt.mode === 'trusted' && value.trainerTrusted)
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function pickSelectedLabel(key: FilterKey, v: InnerCourseFilterValue): string | undefined {
  switch (key) {
    case 'comprehensive':
      return v.sortLabel;
    case 'category':
      return v.categoryName;
    case 'trainerCity':
      return v.trainerProvinceName;
    case 'industry':
      return v.industryCategoryName;
    case 'exclusive':
      if (v.trainerHasCopyright) return '独家讲师';
      if (v.trainerTrusted) return '平台认证';
      return undefined;
  }
}

function CategoryTwoLevelPanel({
  tree,
  selectedId,
  onPick,
}: {
  tree: CategoryTreeNode[];
  selectedId?: number;
  onPick: (id?: number, name?: string) => void;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <button
          type="button"
          onClick={() => onPick(undefined, undefined)}
          className={`text-left cursor-pointer transition-colors ${
            !selectedId ? 'text-primary font-semibold' : 'text-slate-500 hover:text-primary'
          }`}
        >
          全部 / 不限
        </button>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
        {tree.map((lvl1) => (
          <button
            key={lvl1.id}
            type="button"
            onClick={() => onPick(lvl1.id, lvl1.name)}
            className={`text-left cursor-pointer transition-colors truncate ${
              selectedId === lvl1.id
                ? 'text-primary font-semibold'
                : 'text-slate-700 hover:text-primary'
            }`}
          >
            {lvl1.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProvincePanel({
  provinces,
  selectedId,
  onPick,
}: {
  provinces: RegionItem[];
  selectedId?: number;
  onPick: (id?: number, name?: string) => void;
}) {
  return (
    <div className="text-sm">
      <div className="grid grid-cols-4 gap-x-3 gap-y-3">
        <button
          type="button"
          onClick={() => onPick(undefined, undefined)}
          className={`text-left cursor-pointer transition-colors ${
            !selectedId ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'
          }`}
        >
          全国
        </button>
        {provinces.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id, p.name)}
            className={`text-left cursor-pointer transition-colors truncate ${
              selectedId === p.id ? 'text-primary font-medium' : 'text-slate-600 hover:text-primary'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
