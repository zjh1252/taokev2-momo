export interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

export interface RegionValue {
  provinceId?: number;
  provinceName?: string;
  cityId?: number;
  cityName?: string;
  districtId?: number;
  districtName?: string;
  townId?: number;
  townName?: string;
}

export interface RegionSelection {
  cities: RegionItem[];
  districts: RegionItem[];
  towns: RegionItem[];
  selectedProvince: RegionItem | null;
  selectedCity: RegionItem | null;
  selectedDistrict: RegionItem | null;
  selectedTown: RegionItem | null;
}

export async function hydrateRegionSelection(
  value: RegionValue | undefined,
  provinces: RegionItem[],
  loadChildren: (parentCode?: string) => Promise<RegionItem[]>,
  maxLevel: number,
): Promise<RegionSelection> {
  const selectedProvince = findRegionById(provinces, value?.provinceId);
  if (!selectedProvince) {
    return emptyRegionSelection();
  }

  const cities = await loadChildren(selectedProvince.code);
  const selectedCity = findRegionById(cities, value?.cityId);
  if (!selectedCity || maxLevel < 3) {
    return {
      ...emptyRegionSelection(),
      cities,
      selectedProvince,
      selectedCity,
    };
  }

  const districts = await loadChildren(selectedCity.code);
  const selectedDistrict = findRegionById(districts, value?.districtId);
  if (!selectedDistrict || maxLevel < 4 || !selectedDistrict.hasChildren) {
    return {
      ...emptyRegionSelection(),
      cities,
      districts,
      selectedProvince,
      selectedCity,
      selectedDistrict,
    };
  }

  const towns = await loadChildren(selectedDistrict.code);
  const selectedTown = findRegionById(towns, value?.townId);

  return {
    cities,
    districts,
    towns,
    selectedProvince,
    selectedCity,
    selectedDistrict,
    selectedTown,
  };
}

function findRegionById(regions: RegionItem[], id?: number) {
  if (!id) {
    return null;
  }
  return regions.find((item) => item.id === id) || null;
}

function emptyRegionSelection(): RegionSelection {
  return {
    cities: [],
    districts: [],
    towns: [],
    selectedProvince: null,
    selectedCity: null,
    selectedDistrict: null,
    selectedTown: null,
  };
}
