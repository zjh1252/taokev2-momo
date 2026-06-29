'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/http/client';
import { ChevronDown } from 'lucide-react';

interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface RegionValue {
  provinceId?: number;
  provinceName?: string;
  cityId?: number;
  cityName?: string;
  districtId?: number;
  districtName?: string;
  townId?: number;
  townName?: string;
}

interface RegionCascaderProps {
  value?: RegionValue;
  onChange?: (value: RegionValue) => void;
  /** 是否必须选择到区/县，默认 false（只要求省市） */
  requireDistrict?: boolean;
  /** 最大联动层级：2=省市, 3=省市区(默认), 4=省市区镇 */
  maxLevel?: number;
  disabled?: boolean;
}

async function fetchRegionChildren(parentCode?: string): Promise<RegionItem[]> {
  const qs = parentCode ? `?parentCode=${parentCode}` : '';
  const res = await apiGet<ApiResponse<RegionItem[]>>(`/regions/children${qs}`);
  return res.data || [];
}

/**
 * 省市区（镇）联动选择器（公共组件）
 * <p>
 * 基于后端 GET /regions/children API 逐级加载，
 * 通过 maxLevel 控制联动层级（2=省市 / 3=省市区 / 4=省市区镇），
 * 返回选中地区的 id + name，供表单使用。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
export default function RegionCascader({
  value,
  onChange,
  requireDistrict = false,
  maxLevel = 3,
  disabled = false,
}: RegionCascaderProps) {
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [towns, setTowns] = useState<RegionItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<RegionItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<RegionItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<RegionItem | null>(null);
  const [selectedTown, setSelectedTown] = useState<RegionItem | null>(null);

  useEffect(() => {
    fetchRegionChildren().then(setProvinces).catch(() => {});
  }, []);

  const emitChange = useCallback(
    (
      province: RegionItem | null,
      city: RegionItem | null,
      district: RegionItem | null,
      town: RegionItem | null,
    ) => {
      onChange?.({
        provinceId: province?.id || undefined,
        provinceName: province?.name || undefined,
        cityId: city?.id || undefined,
        cityName: city?.name || undefined,
        districtId: district?.id || undefined,
        districtName: district?.name || undefined,
        townId: town?.id || undefined,
        townName: town?.name || undefined,
      });
    },
    [onChange],
  );

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = provinces.find((p) => p.code === code) || null;
    setSelectedProvince(item);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedTown(null);
    setCities([]);
    setDistricts([]);
    setTowns([]);
    if (item) {
      const list = await fetchRegionChildren(item.code);
      setCities(list);
    }
    emitChange(item, null, null, null);
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = cities.find((c) => c.code === code) || null;
    setSelectedCity(item);
    setSelectedDistrict(null);
    setSelectedTown(null);
    setDistricts([]);
    setTowns([]);
    if (item && maxLevel >= 3) {
      const list = await fetchRegionChildren(item.code);
      setDistricts(list);
    }
    emitChange(selectedProvince, item, null, null);
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = districts.find((d) => d.code === code) || null;
    setSelectedDistrict(item);
    setSelectedTown(null);
    setTowns([]);
    if (item && item.hasChildren && maxLevel >= 4) {
      const list = await fetchRegionChildren(item.code);
      setTowns(list);
    }
    emitChange(selectedProvince, selectedCity, item, null);
  };

  const handleTownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = towns.find((t) => t.code === code) || null;
    setSelectedTown(item);
    emitChange(selectedProvince, selectedCity, selectedDistrict, item);
  };

  const selectClass =
    'appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[130px] disabled:bg-slate-50 disabled:text-gray-400';

  return (
    <div className="flex gap-2 flex-wrap">
      {/* 省 */}
      <div className="relative">
        <select
          value={selectedProvince?.code || ''}
          onChange={handleProvinceChange}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">请选择省份</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <ChevronDown className="size-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* 市 */}
      {cities.length > 0 && (
        <div className="relative">
          <select
            value={selectedCity?.code || ''}
            onChange={handleCityChange}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">请选择城市</option>
            {cities.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="size-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* 区/县 */}
      {maxLevel >= 3 && districts.length > 0 && (
        <div className="relative">
          <select
            value={selectedDistrict?.code || ''}
            onChange={handleDistrictChange}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">{requireDistrict ? '请选择区/县' : '区/县（可选）'}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="size-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* 镇/街道 */}
      {maxLevel >= 4 && towns.length > 0 && (
        <div className="relative">
          <select
            value={selectedTown?.code || ''}
            onChange={handleTownChange}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">镇/街道（可选）</option>
            {towns.map((t) => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="size-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}
    </div>
  );
}

export type { RegionValue };
