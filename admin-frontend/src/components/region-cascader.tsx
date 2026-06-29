'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type RegionItem = {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
};

export type RegionValue = {
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  townId?: number;
};

type RegionCascaderProps = {
  value?: RegionValue;
  onChange?: (value: RegionValue) => void;
  requireDistrict?: boolean;
  maxLevel?: 2 | 3 | 4;
  disabled?: boolean;
};

async function fetchRegionChildren(parentCode?: string): Promise<RegionItem[]> {
  const qs = parentCode ? `?parentCode=${encodeURIComponent(parentCode)}` : '';
  const resp = await apiClient<{ data: RegionItem[] }>(`/regions/children${qs}`);
  return resp.data ?? [];
}

export function RegionCascader({
  value,
  onChange,
  requireDistrict = false,
  maxLevel = 3,
  disabled = false
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
    void fetchRegionChildren().then(setProvinces).catch(() => setProvinces([]));
  }, []);

  const emitChange = useCallback(
    (
      province: RegionItem | null,
      city: RegionItem | null,
      district: RegionItem | null,
      town: RegionItem | null
    ) => {
      onChange?.({
        provinceId: province?.id,
        cityId: city?.id,
        districtId: district?.id,
        townId: town?.id
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (!value?.provinceId || provinces.length === 0) return;
    const province = provinces.find((item) => item.id === value.provinceId);
    if (!province || selectedProvince?.id === province.id) return;
    setSelectedProvince(province);
    void fetchRegionChildren(province.code).then(setCities).catch(() => setCities([]));
  }, [value?.provinceId, provinces, selectedProvince?.id]);

  useEffect(() => {
    if (!value?.cityId || cities.length === 0) return;
    const city = cities.find((item) => item.id === value.cityId);
    if (!city || selectedCity?.id === city.id) return;
    setSelectedCity(city);
    if (maxLevel >= 3) {
      void fetchRegionChildren(city.code).then(setDistricts).catch(() => setDistricts([]));
    }
  }, [value?.cityId, cities, maxLevel, selectedCity?.id]);

  useEffect(() => {
    if (!value?.districtId || districts.length === 0) return;
    const district = districts.find((item) => item.id === value.districtId);
    if (!district || selectedDistrict?.id === district.id) return;
    setSelectedDistrict(district);
    if (maxLevel >= 4) {
      void fetchRegionChildren(district.code).then(setTowns).catch(() => setTowns([]));
    }
  }, [value?.districtId, districts, maxLevel, selectedDistrict?.id]);

  useEffect(() => {
    if (!value?.townId || towns.length === 0) return;
    const town = towns.find((item) => item.id === value.townId);
    if (town && selectedTown?.id !== town.id) {
      setSelectedTown(town);
    }
  }, [value?.townId, towns, selectedTown?.id]);

  const handleProvinceChange = (code: string) => {
    const province = provinces.find((item) => item.code === code) ?? null;
    setSelectedProvince(province);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedTown(null);
    setCities([]);
    setDistricts([]);
    setTowns([]);
    if (province) {
      void fetchRegionChildren(province.code).then(setCities).catch(() => setCities([]));
    }
    emitChange(province, null, null, null);
  };

  const handleCityChange = (code: string) => {
    const city = cities.find((item) => item.code === code) ?? null;
    setSelectedCity(city);
    setSelectedDistrict(null);
    setSelectedTown(null);
    setDistricts([]);
    setTowns([]);
    if (city && maxLevel >= 3) {
      void fetchRegionChildren(city.code).then(setDistricts).catch(() => setDistricts([]));
    }
    emitChange(selectedProvince, city, null, null);
  };

  const handleDistrictChange = (code: string) => {
    const district = districts.find((item) => item.code === code) ?? null;
    setSelectedDistrict(district);
    setSelectedTown(null);
    setTowns([]);
    if (district && maxLevel >= 4) {
      void fetchRegionChildren(district.code).then(setTowns).catch(() => setTowns([]));
    }
    emitChange(selectedProvince, selectedCity, district, null);
  };

  const handleTownChange = (code: string) => {
    const town = towns.find((item) => item.code === code) ?? null;
    setSelectedTown(town);
    emitChange(selectedProvince, selectedCity, selectedDistrict, town);
  };

  return (
    <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
      <Select
        disabled={disabled}
        value={selectedProvince?.code ?? ''}
        onValueChange={handleProvinceChange}
      >
        <SelectTrigger>
          <SelectValue placeholder='省' />
        </SelectTrigger>
        <SelectContent>
          {provinces.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled || !selectedProvince}
        value={selectedCity?.code ?? ''}
        onValueChange={handleCityChange}
      >
        <SelectTrigger>
          <SelectValue placeholder='市' />
        </SelectTrigger>
        <SelectContent>
          {cities.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {maxLevel >= 3 ? (
        <Select
          disabled={disabled || !selectedCity}
          value={selectedDistrict?.code ?? ''}
          onValueChange={handleDistrictChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={requireDistrict ? '区/县 *' : '区/县'} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {maxLevel >= 4 ? (
        <Select
          disabled={disabled || !selectedDistrict}
          value={selectedTown?.code ?? ''}
          onValueChange={handleTownChange}
        >
          <SelectTrigger>
            <SelectValue placeholder='街道/镇' />
          </SelectTrigger>
          <SelectContent>
            {towns.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
