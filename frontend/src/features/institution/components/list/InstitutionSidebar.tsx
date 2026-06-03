'use client';

import { useEffect, useState } from 'react';
import { Search, Star, Flame, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { apiGet } from '@/lib/http/client';
import type { InstitutionFacets } from '../../api/service';
import type { InstitutionListItem } from '../../types';

export interface InstitutionFilters {
  keyword: string;
  specialty?: string;
  industry?: string;
  provinceId?: number;
  provinceCode?: string;
  cityId?: number;
  minScore?: number;
}

interface RegionItem {
  id: number;
  code: string;
  name: string;
}

interface InstitutionSidebarProps {
  facets: InstitutionFacets;
  provinces: RegionItem[];
  topRated: InstitutionListItem[];
  weeklyActive: InstitutionListItem[];
  newest: InstitutionListItem[];
  filters: InstitutionFilters;
  onApply: (filters: InstitutionFilters) => void;
  basePath?: string;
}

const SCORE_OPTIONS = [
  { label: '不限', value: undefined },
  { label: '5 星', value: 5 },
  { label: '4 星以上', value: 4 },
  { label: '3 星以上', value: 3 },
];

export function InstitutionSidebar({
  facets,
  provinces,
  topRated,
  weeklyActive,
  newest,
  filters,
  onApply,
  basePath = '/institutions',
}: InstitutionSidebarProps) {
  const [draft, setDraft] = useState<InstitutionFilters>(filters);
  const [cities, setCities] = useState<RegionItem[]>([]);

  // 外部应用的筛选变化时同步草稿（如类别点击）
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  // 省份变化时加载城市
  useEffect(() => {
    if (!draft.provinceCode) {
      setCities([]);
      return;
    }
    let alive = true;
    apiGet<{ data: RegionItem[] }>(`/regions/children?parentCode=${draft.provinceCode}`)
      .then((res) => alive && setCities(res.data || []))
      .catch(() => alive && setCities([]));
    return () => {
      alive = false;
    };
  }, [draft.provinceCode]);

  const patch = (p: Partial<InstitutionFilters>) => setDraft((prev) => ({ ...prev, ...p }));

  const handleProvinceChange = (code: string) => {
    const prov = provinces.find((p) => p.code === code);
    patch({
      provinceCode: code || undefined,
      provinceId: prov?.id,
      cityId: undefined,
    });
  };

  const selectClass =
    'flex-1 w-0 border border-slate-200 bg-white rounded px-2 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none transition-colors';

  return (
    <aside className="w-[260px] shrink-0 flex flex-col gap-5">
      {/* 搜索区（多筛选项） */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center">
          <h3 className="font-bold text-primary text-[15px]">机构搜索</h3>
        </div>
        <div className="p-4 flex flex-col gap-3 text-xs">
          <Field label="擅长领域">
            <select
              value={draft.specialty ?? ''}
              onChange={(e) => patch({ specialty: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">不限</option>
              {facets.specialties.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="擅长行业">
            <select
              value={draft.industry ?? ''}
              onChange={(e) => patch({ industry: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">不限</option>
              {facets.industries.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="所在省份">
            <select
              value={draft.provinceCode ?? ''}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className={selectClass}
            >
              <option value="">不限</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.code}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="所在城市">
            <select
              value={draft.cityId ?? ''}
              onChange={(e) => patch({ cityId: e.target.value ? Number(e.target.value) : undefined })}
              disabled={!draft.provinceCode}
              className={`${selectClass} disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="">不限</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="星级评价">
            <select
              value={draft.minScore ?? ''}
              onChange={(e) => patch({ minScore: e.target.value ? Number(e.target.value) : undefined })}
              className={selectClass}
            >
              {SCORE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value ?? ''}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="关 键 字">
            <input
              type="text"
              value={draft.keyword}
              onChange={(e) => patch({ keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && onApply(draft)}
              placeholder="机构名称..."
              className={selectClass}
            />
          </Field>
          <div className="flex justify-center mt-1">
            <button
              onClick={() => onApply(draft)}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-1.5 px-8 rounded-full flex items-center gap-1 transition-all shadow-sm text-xs"
            >
              <Search className="size-3.5" /> 搜索
            </button>
          </div>
        </div>
      </div>

      {/* 培训机构类别（动态计数 + 可点筛选） */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center">
          <h3 className="font-bold text-primary text-[15px]">培训机构类别</h3>
        </div>
        <div className="py-2 max-h-[350px] overflow-y-auto custom-scrollbar">
          <ul className="flex flex-col text-xs">
            {facets.specialties.length === 0 && (
              <li className="px-5 py-3 text-slate-400">暂无分类</li>
            )}
            {facets.specialties.map((cat) => {
              const active = filters.specialty === cat.name;
              return (
                <li key={cat.name}>
                  <button
                    type="button"
                    onClick={() => onApply({ ...filters, specialty: active ? undefined : cat.name })}
                    className={`w-full flex justify-between items-center px-5 py-2.5 transition-colors border-b border-slate-50 ${
                      active
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'hover:bg-slate-50 hover:text-primary text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">·</span> {cat.name}
                    </span>
                    <span className="text-slate-400">{cat.count} 家 ›</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <RankCard
        title="高分培训机构"
        icon={<Star className="size-4 text-amber-500" />}
        items={topRated}
        basePath={basePath}
        showScore
      />
      <RankCard
        title="本周活跃培训机构"
        icon={<Flame className="size-4 text-orange-500" />}
        items={weeklyActive}
        basePath={basePath}
      />
      <RankCard
        title="最新加入培训机构"
        icon={<Clock className="size-4 text-sky-500" />}
        items={newest}
        basePath={basePath}
      />
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-600 w-16 shrink-0 text-right">{label}：</span>
      {children}
    </div>
  );
}

function RankCard({
  title,
  icon,
  items,
  basePath,
  showScore,
}: {
  title: string;
  icon: React.ReactNode;
  items: InstitutionListItem[];
  basePath: string;
  showScore?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-slate-700 text-[14px]">{title}</h3>
      </div>
      <ul className="flex flex-col text-xs p-2">
        {items.map((inst, idx) => (
          <li key={inst.id}>
            <Link
              href={`${basePath}/${inst.id}`}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span
                className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${
                  idx < 3 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {idx + 1}
              </span>
              <div className="w-8 h-8 shrink-0 rounded overflow-hidden border border-slate-100 bg-white flex items-center justify-center">
                <SafeImage
                  src={inst.logoUrl}
                  fallback={`https://ui-avatars.com/api/?name=${encodeURIComponent(inst.orgName.slice(0, 2))}&background=F1F5F9&color=475569&size=64`}
                  alt={inst.orgName}
                  width={32}
                  height={32}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <span className="flex-1 min-w-0 truncate text-slate-700 hover:text-primary">{inst.orgName}</span>
              {showScore && inst.score > 0 && (
                <span className="shrink-0 text-amber-500 font-semibold">{inst.score.toFixed(1)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
