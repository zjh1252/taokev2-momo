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
 *   <li>样式与 {@code /opencourses} 的 {@code OpenCourseFilters} 对齐：左侧只列分类标题，
 *       鼠标 hover 弹出右侧浮层选项面板。</li>
 *   <li>「擅长领域」「擅长行业」均按二级分类展示：浮层中以一级为段落标题，
 *       一级下方平铺二级，点击任一节点（含一级本身）即可生效。</li>
 *   <li>「长驻省市」从 {@code GET /regions/children} 拉取省份列表，多列网格展示。</li>
 *   <li>所有可点击元素显式给出 hover 颜色变化，避免「能点没反馈」。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 18:00
 */

export interface TrainerFilterValue {
  expertiseCategoryId?: number;
  expertiseCategoryName?: string;
  industryCategoryId?: number;
  industryCategoryName?: string;
  provinceId?: number;
  provinceName?: string;
  /** 质量承诺：true 表示仅看「信得过」专家 */
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

  const handleExpertise = (id?: number, name?: string) => {
    onChange({ ...value, expertiseCategoryId: id, expertiseCategoryName: name });
    closeFlyout();
  };
  const handleIndustry = (id?: number, name?: string) => {
    onChange({ ...value, industryCategoryId: id, industryCategoryName: name });
    closeFlyout();
  };
  const handleProvince = (id?: number, name?: string) => {
    onChange({ ...value, provinceId: id, provinceName: name });
    closeFlyout();
  };

  const activeMeta = FILTER_ITEMS.find((f) => f.key === activeFilter);

  const toggleTrusted = () => {
    onChange({ ...value, trustedOnly: !value.trustedOnly });
  };

  return (
    <div className="w-64 shrink-0 relative" onMouseLeave={handleMouseLeave}>
      <aside className="bg-white rounded-xl shadow-sm border border-slate-100">
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

        {/* 质量承诺 — 内联勾选，无浮层 */}
        <div
          className="p-4 flex items-center justify-between"
          onMouseEnter={() => {
            if (leaveTimer.current) {
              clearTimeout(leaveTimer.current);
              leaveTimer.current = null;
            }
            setActiveFilter(null);
          }}
        >
          <span className="font-semibold text-slate-800 text-sm">质量承诺</span>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none group/cb">
            <input
              type="checkbox"
              checked={!!value.trustedOnly}
              onChange={toggleTrusted}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover/cb:text-primary transition-colors">
              信得过
            </span>
          </label>
        </div>
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
            {activeFilter === 'expertise' && (
              <CategoryTwoLevelPanel
                tree={expertiseTree}
                selectedId={value.expertiseCategoryId}
                onPick={handleExpertise}
              />
            )}
            {activeFilter === 'industry' && (
              <CategoryTwoLevelPanel
                tree={industryTree}
                selectedId={value.industryCategoryId}
                onPick={handleIndustry}
              />
            )}
            {activeFilter === 'province' && (
              <ProvincePanel
                provinces={provinces}
                selectedId={value.provinceId}
                onPick={handleProvince}
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
      return v.expertiseCategoryName;
    case 'industry':
      return v.industryCategoryName;
    case 'province':
      return v.provinceName;
  }
}

/* ---- 子面板 ---- */

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
    <div className="space-y-5 text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => onPick(undefined, undefined)}
          className={`text-left cursor-pointer transition-colors ${
            !selectedId
              ? 'text-primary font-semibold'
              : 'text-slate-500 hover:text-primary'
          }`}
        >
          全部 / 不限
        </button>
      </div>
      {tree.map((lvl1) => (
        <div key={lvl1.id}>
          <div className="mb-2">
            <button
              type="button"
              onClick={() => onPick(lvl1.id, lvl1.name)}
              className={`font-bold text-[14px] cursor-pointer transition-colors ${
                selectedId === lvl1.id
                  ? 'text-primary'
                  : 'text-slate-800 hover:text-primary'
              }`}
            >
              {lvl1.name}
            </button>
          </div>
          {lvl1.children && lvl1.children.length > 0 && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 pl-1">
              {lvl1.children.map((lvl2) => (
                <button
                  key={lvl2.id}
                  type="button"
                  onClick={() => onPick(lvl2.id, lvl2.name)}
                  className={`text-left cursor-pointer transition-colors ${
                    selectedId === lvl2.id
                      ? 'text-primary font-medium'
                      : 'text-slate-600 hover:text-primary'
                  }`}
                >
                  {lvl2.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
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
            !selectedId
              ? 'text-primary font-semibold'
              : 'text-slate-600 hover:text-primary'
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
              selectedId === p.id
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
