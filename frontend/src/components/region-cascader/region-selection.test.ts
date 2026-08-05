import { describe, expect, it } from 'vitest';
import { hydrateRegionSelection, type RegionItem } from './region-selection';

const province: RegionItem = {
  id: 1,
  code: '110000',
  name: 'Province',
  level: 1,
  hasChildren: true,
};

const city: RegionItem = {
  id: 11,
  code: '110100',
  name: 'City',
  level: 2,
  hasChildren: true,
};

const district: RegionItem = {
  id: 111,
  code: '110101',
  name: 'District',
  level: 3,
  hasChildren: false,
};

describe('hydrateRegionSelection', () => {
  it('loads child options and selects the saved region ids', async () => {
    const calls: string[] = [];
    const loadChildren = async (parentCode?: string) => {
      calls.push(parentCode || '');
      if (parentCode === province.code) {
        return [city];
      }
      if (parentCode === city.code) {
        return [district];
      }
      return [];
    };

    const result = await hydrateRegionSelection(
      {
        provinceId: province.id,
        cityId: city.id,
        districtId: district.id,
      },
      [province],
      loadChildren,
      3,
    );

    expect(calls).toEqual([province.code, city.code]);
    expect(result.selectedProvince).toBe(province);
    expect(result.selectedCity).toBe(city);
    expect(result.selectedDistrict).toBe(district);
    expect(result.cities).toEqual([city]);
    expect(result.districts).toEqual([district]);
  });
});
