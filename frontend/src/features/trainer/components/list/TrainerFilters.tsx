'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiGet } from '@/lib/http/client';
import type { CategoryTreeNode } from '../../types';

/**
 * 专家列表页 — 左侧筛选侧栏
 *
 * <p>设计要点：</p>
 * <ul>
 *   <li>左侧只列分类标题，鼠标 hover 弹出右侧浮层选项面板。</li>
 *   <li>「擅长领域」按二级分类展示：选中一级直接传一级名；
 *       选中二级传 {@code "一级_二级"}；后端按叶子节点搜索。</li>
 *   <li>「擅长行业」单选，点击即替换。</li>
 *   <li>「长驻省市」单选，从 {@code GET /regions/children} 拉取省份列表。</li>
 *   <li>全部参数均可选可清，点「全部/不限」清除。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 18:00
 */

export interface TrainerFilterValue {
  /** 擅长领域 — 一级名称（无二级时直接传一级） */
  fieldParentName?: string;
  /** 擅长领域 — 二级名称（有则传 "一级_二级"） */
  fieldChildName?: string;
  /** 擅长领域分类 ID（优先于名称解析） */
  expertiseCategoryId?: number;
  /** 擅长行业 — 行业名称 */
  industryName?: string;
  /** 擅长行业分类 ID */
  industryCategoryId?: number;
  /** 长驻省市 — 省份名称 */
  regionName?: string;
  /** 长驻省市 — 省份 ID（传给后端筛选） */
  provinceId?: number;
  /** 质量承诺 */
  trustedOnly?: boolean;
}

type FilterKey = 'expertise' | 'industry' | 'province';

interface FilterMeta {
  key: FilterKey;
  label: string;
  flyoutWidth: number;
}

const FILTER_ITEMS: FilterMeta[] = [
  { key: 'expertise', label: '擅长领域', flyoutWidth: 520 },
  { key: 'industry', label: '擅长行业', flyoutWidth: 520 },
  { key: 'province', label: '长驻省市', flyoutWidth: 520 },
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

interface TrainerFiltersProps {
  expertiseTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
  value: TrainerFilterValue;
  onChange: (value: TrainerFilterValue) => void;
}

export function TrainerFilters({
  expertiseTree,
  industryTree,
  value,
  onChange,
}: TrainerFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProvinces()
      .then((list) => setProvinces(list))
      .catch(() => {});
  }, []);

  const handleMouseEnter = useCallback((key: FilterKey) => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    setActiveFilter(key);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setActiveFilter(null), 80);
  }, []);

  // ---- 擅长领域：追踪 parent + child + 分类 ID ----
  const handleExpertisePick = (parentName?: string, childName?: string, categoryId?: number) => {
    onChange({
      ...value,
      fieldParentName: parentName,
      fieldChildName: childName,
      expertiseCategoryId: categoryId,
    });
  };

  // ---- 擅长行业：单选 ----
  const handleIndustryPick = (name?: string, categoryId?: number) => {
    onChange({ ...value, industryName: name, industryCategoryId: categoryId });
  };

  // ---- 长驻省市：单选 ----
  const handleProvincePick = (item?: RegionItem) => {
    onChange({ ...value, regionName: item?.name, provinceId: item?.id });
  };

  const activeMeta = FILTER_ITEMS.find((f) => f.key === activeFilter);

  return (
    <div className="w-64 shrink-0 relative" onMouseLeave={handleMouseLeave}>
      <aside className="bg-white rounded-xl shadow-sm border border-slate-100">
        <h2 className="px-4 py-3 text-sm font-bold text-slate-800 border-b border-slate-100">
          讲师筛选条件
        </h2>
        {FILTER_ITEMS.map((item) => {
          const selected = pickSelectedLabel(item.key, value);
          return (
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
                  {selected && (
                    <span className="text-xs text-primary mt-0.5 truncate max-w-[170px]">
                      {selected}
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
          );
        })}

        {/* 质量承诺 */}
        <div
          className="p-4 flex items-center justify-between"
          onMouseEnter={() => {
            if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
            setActiveFilter(null);
          }}
        >
          <span className="font-semibold text-slate-800 text-sm">质量承诺</span>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!value.trustedOnly}
              onChange={() => onChange({ ...value, trustedOnly: !value.trustedOnly })}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-sm text-slate-600 hover:text-primary transition-colors">
              信得过
            </span>
          </label>
        </div>
      </aside>

      {/* 浮层面板 */}
      {activeFilter && activeMeta && (
        <div
          className="absolute left-full top-0 min-h-full pl-2 z-50"
          onMouseEnter={() => {
            if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 max-h-[70vh] overflow-y-auto"
            style={{ width: activeMeta.flyoutWidth }}
          >
            {activeFilter === 'expertise' && (
              <ExpertisePanel
                tree={expertiseTree}
                parentName={value.fieldParentName}
                childName={value.fieldChildName}
                onPick={handleExpertisePick}
              />
            )}
            {activeFilter === 'industry' && (
              <SingleSelectPanel
                tree={industryTree}
                selectedName={value.industryName}
                onPick={handleIndustryPick}
                label="全部行业"
              />
            )}
            {activeFilter === 'province' && (
              <ProvincePanel
                provinces={provinces}
                selectedName={value.regionName}
                onPick={handleProvincePick}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function pickSelectedLabel(key: FilterKey, v: TrainerFilterValue): string | undefined {
  switch (key) {
    case 'expertise':
      return v.fieldChildName
        ? `${v.fieldParentName} / ${v.fieldChildName}`
        : v.fieldParentName || undefined;
    case 'industry':
      return v.industryName;
    case 'province':
      return v.regionName;
  }
}

/* ==================== 擅长领域面板（仅一级，网格布局） ==================== */

function ExpertisePanel({
  tree,
  parentName,
  onPick,
}: {
  tree: CategoryTreeNode[];
  parentName?: string;
  childName?: string;
  onPick: (parentName?: string, childName?: string, categoryId?: number) => void;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <button
          type="button"
          onClick={() => onPick(undefined, undefined, undefined)}
          className={`text-left cursor-pointer transition-colors ${
            !parentName ? 'text-primary font-semibold' : 'text-slate-500 hover:text-primary'
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
            onClick={() => onPick(lvl1.name, undefined, lvl1.id)}
            className={`text-left cursor-pointer transition-colors truncate ${
              parentName === lvl1.name
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

/* ==================== 通用单选面板（擅长行业，仅一级，网格布局） ==================== */

function SingleSelectPanel({
  tree,
  selectedName,
  onPick,
  label,
}: {
  tree: CategoryTreeNode[];
  selectedName?: string;
  onPick: (name?: string, categoryId?: number) => void;
  label: string;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <button
          type="button"
          onClick={() => onPick(undefined, undefined)}
          className={`text-left cursor-pointer transition-colors ${
            !selectedName ? 'text-primary font-semibold' : 'text-slate-500 hover:text-primary'
          }`}
        >
          {label}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
        {tree.map((lvl1) => (
          <button
            key={lvl1.id}
            type="button"
            onClick={() => onPick(lvl1.name, lvl1.id)}
            className={`text-left cursor-pointer transition-colors truncate ${
              selectedName === lvl1.name
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

/* ==================== 省份单选面板 ==================== */

function ProvincePanel({
  provinces,
  selectedName,
  onPick,
}: {
  provinces: RegionItem[];
  selectedName?: string;
  onPick: (item?: RegionItem) => void;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <button
          type="button"
          onClick={() => onPick(undefined)}
          className={`text-left cursor-pointer transition-colors ${
            !selectedName ? 'text-primary font-semibold' : 'text-slate-600 hover:text-primary'
          }`}
        >
          全国
        </button>
      </div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-3">
        {provinces.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className={`text-left cursor-pointer transition-colors truncate ${
              selectedName === p.name
                ? 'text-primary font-medium'
                : 'text-slate-600 hover:text-primary'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
