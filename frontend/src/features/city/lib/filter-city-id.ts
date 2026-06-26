import type { CityChannelDetail } from '../api/types';

/** 直辖市 slug — 老库 course_plans / 专家 cityId 存省级 region.id */
const MUNICIPALITY_SLUGS = new Set(['beijing', 'shanghai', 'tianjin', 'chongqing']);

/**
 * 城市频道筛选用 region.id。
 * 直辖市在 API 未升级前可能返回市辖区 id，需 fallback 到 provinceRegionId。
 */
export function resolveCityFilterId(
  detail: Pick<CityChannelDetail, 'enName' | 'cityRegionId' | 'provinceRegionId'>,
): number {
  if (MUNICIPALITY_SLUGS.has(detail.enName) && detail.provinceRegionId != null) {
    return detail.provinceRegionId;
  }
  return detail.cityRegionId;
}
