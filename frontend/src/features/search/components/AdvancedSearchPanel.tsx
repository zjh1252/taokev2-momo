'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { apiGet } from '@/lib/http/client';
import type { SearchTab } from '../api/types';

interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
}

interface FilterValues {
  provinceId?: number;
  cityId?: number;
  minExperienceYears?: number;
  expertiseCategoryId?: number;
  categoryId?: number;
  subCategoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
}

interface AdvancedSearchPanelProps {
  tab: SearchTab;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

export function AdvancedSearchPanel({ tab, values, onChange }: AdvancedSearchPanelProps) {
  const t = useTranslations('search.filter');

  if (tab === 'trainer') {
    return <TrainerFilters values={values} onChange={onChange} t={t} />;
  }
  return <CourseFilters values={values} onChange={onChange} t={t} />;
}

// --------------- 专家筛选 ---------------

const SELECT_CLS = 'border border-slate-200 rounded-md px-3 py-1.5 text-sm bg-white min-w-[120px] hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer';
const SELECT_SM_CLS = 'border border-slate-200 rounded-md px-3 py-1.5 text-sm bg-white min-w-[100px] hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer';
const RESET_BTN_CLS = 'text-xs text-slate-400 hover:text-primary hover:bg-slate-100 px-2 py-1 rounded transition-colors';

function TrainerFilters({
  values,
  onChange,
  t
}: { values: FilterValues; onChange: (v: FilterValues) => void; t: ReturnType<typeof useTranslations> }) {
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [expertiseCategories, setExpertiseCategories] = useState<CategoryNode[]>([]);

  useEffect(() => {
    apiGet<{ data: RegionItem[] }>('/regions/children')
      .then((res) => setProvinces(res.data || []))
      .catch(() => {});
    apiGet<{ data: CategoryNode[] }>('/categories/tree?type=TRAINER_EXPERTISE')
      .then((res) => setExpertiseCategories(res.data || []))
      .catch(() => {});
  }, []);

  const handleProvinceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pId = e.target.value ? Number(e.target.value) : undefined;
      const province = provinces.find((p) => p.id === pId);
      setSelectedProvinceCode(province?.code ?? '');
      onChange({ ...values, provinceId: pId, cityId: undefined });
    },
    [provinces, values, onChange]
  );

  useEffect(() => {
    if (!selectedProvinceCode) {
      setCities([]);
      return;
    }
    apiGet<{ data: RegionItem[] }>(`/regions/children?parentCode=${selectedProvinceCode}`)
      .then((res) => setCities(res.data || []))
      .catch(() => {});
  }, [selectedProvinceCode]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('province')}：</span>
        <select
          value={values.provinceId ?? ''}
          onChange={handleProvinceChange}
          className={SELECT_CLS}
        >
          <option value="">{t('allProvinces')}</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('city')}：</span>
        <select
          value={values.cityId ?? ''}
          onChange={(e) => onChange({ ...values, cityId: e.target.value ? Number(e.target.value) : undefined })}
          className={SELECT_CLS}
          disabled={!values.provinceId}
        >
          <option value="">{t('allCities')}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('expertise')}：</span>
        <select
          value={values.expertiseCategoryId ?? ''}
          onChange={(e) =>
            onChange({ ...values, expertiseCategoryId: e.target.value ? Number(e.target.value) : undefined })
          }
          className={SELECT_CLS}
        >
          <option value="">{t('allExpertise')}</option>
          {expertiseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('minExperience')}：</span>
        <select
          value={values.minExperienceYears ?? ''}
          onChange={(e) =>
            onChange({ ...values, minExperienceYears: e.target.value ? Number(e.target.value) : undefined })
          }
          className={SELECT_SM_CLS}
        >
          <option value="">{t('allDurations')}</option>
          {[3, 5, 10, 15, 20].map((y) => (
            <option key={y} value={y}>{y}{t('yearUnit')}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => onChange({ provinceId: undefined, cityId: undefined, minExperienceYears: undefined, expertiseCategoryId: undefined })}
        className={RESET_BTN_CLS}
      >
        {t('reset')}
      </button>
    </div>
  );
}

// --------------- 课程筛选 ---------------

function CourseFilters({
  values,
  onChange,
  t
}: { values: FilterValues; onChange: (v: FilterValues) => void; t: ReturnType<typeof useTranslations> }) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryNode[]>([]);

  useEffect(() => {
    apiGet<{ data: CategoryNode[] }>('/categories/tree?type=COURSE_CATEGORY')
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (values.categoryId) {
      const parent = categories.find((c) => c.id === values.categoryId);
      setSubCategories(parent?.children ?? []);
    } else {
      setSubCategories([]);
    }
  }, [values.categoryId, categories]);

  const INPUT_CLS = 'border border-slate-200 rounded-md px-3 py-1.5 text-sm bg-white w-[90px] hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors';

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('category')}：</span>
        <select
          value={values.categoryId ?? ''}
          onChange={(e) =>
            onChange({ ...values, categoryId: e.target.value ? Number(e.target.value) : undefined, subCategoryId: undefined })
          }
          className={SELECT_CLS}
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      {subCategories.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-slate-400 whitespace-nowrap">{t('subCategory')}：</span>
          <select
            value={values.subCategoryId ?? ''}
            onChange={(e) =>
              onChange({ ...values, subCategoryId: e.target.value ? Number(e.target.value) : undefined })
            }
            className={SELECT_CLS}
          >
            <option value="">{t('allCategories')}</option>
            {subCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('priceRange')}：</span>
        <input
          type="number"
          placeholder={t('minPrice')}
          value={values.minPrice ?? ''}
          onChange={(e) => onChange({ ...values, minPrice: e.target.value ? Number(e.target.value) : undefined })}
          className={INPUT_CLS}
        />
        <span className="text-slate-300">—</span>
        <input
          type="number"
          placeholder={t('maxPrice')}
          value={values.maxPrice ?? ''}
          onChange={(e) => onChange({ ...values, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          className={INPUT_CLS}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 whitespace-nowrap">{t('durationDays')}：</span>
        <select
          value={values.durationDays ?? ''}
          onChange={(e) =>
            onChange({ ...values, durationDays: e.target.value ? Number(e.target.value) : undefined })
          }
          className={SELECT_SM_CLS}
        >
          <option value="">{t('allDurations')}</option>
          {[1, 2, 3, 5, 7, 10, 14].map((d) => (
            <option key={d} value={d}>{d}{t('dayUnit')}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => onChange({
          categoryId: undefined,
          subCategoryId: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          durationDays: undefined
        })}
        className={RESET_BTN_CLS}
      >
        {t('reset')}
      </button>
    </div>
  );
}
