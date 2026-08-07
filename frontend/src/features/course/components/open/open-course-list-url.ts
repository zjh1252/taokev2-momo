import type { OpenCourseFilterValue } from './OpenCourseFilters';

/**
 * 公开课列表地址栏筛选解析（replaceState 写入后，Next searchParams 可能仍为空）
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:00
 */

export type OpenCourseBrowserState = {
  filters: OpenCourseFilterValue;
  page: number;
  institutionId?: number;
  lockedCityIds?: number[];
  lockedCityNames?: string[];
};

function parsePositiveIntList(values: string[]): number[] {
  return values
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** 从 query string / URLSearchParams 解析公开课筛选 */
export function parseOpenCourseFiltersFromSearch(
  search: string | URLSearchParams,
): OpenCourseBrowserState {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      : search;
  const categoryIds = parsePositiveIntList(params.getAll('categoryIds'));
  const categoryNames = params.getAll('categoryName').filter(Boolean);
  const provinceIds = parsePositiveIntList(params.getAll('provinceIds'));
  const provinceNames = params.getAll('provinceName').filter(Boolean);
  const lockedCityIds = parsePositiveIntList(params.getAll('cityIds'));
  const lockedCityNames = params.getAll('cityName').filter(Boolean);
  const institutionRaw = Number(params.get('institutionId') || '');
  const institutionId =
    Number.isFinite(institutionRaw) && institutionRaw > 0 ? institutionRaw : undefined;
  const page = Math.max(1, Number(params.get('page') || 1) || 1);

  return {
    filters: {
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      categoryNames: categoryNames.length > 0 ? categoryNames : undefined,
      provinceIds: provinceIds.length > 0 ? provinceIds : undefined,
      provinceNames: provinceNames.length > 0 ? provinceNames : undefined,
    },
    page,
    institutionId,
    lockedCityIds: lockedCityIds.length > 0 ? lockedCityIds : undefined,
    lockedCityNames: lockedCityNames.length > 0 ? lockedCityNames : undefined,
  };
}

/** 从浏览器地址栏读取公开课筛选 */
export function readOpenCourseFiltersFromBrowser(): OpenCourseBrowserState {
  if (typeof window === 'undefined') {
    return { filters: {}, page: 1 };
  }
  return parseOpenCourseFiltersFromSearch(window.location.search);
}

export function hasOpenCourseBrowserFilter(state: OpenCourseBrowserState): boolean {
  return (
    (state.filters.categoryIds?.length ?? 0) > 0
    || (state.filters.provinceIds?.length ?? 0) > 0
    || (state.lockedCityIds?.length ?? 0) > 0
    || state.institutionId != null
    || state.page > 1
  );
}

export function openCourseBrowserDiffersFromSsr(
  browser: OpenCourseBrowserState,
  ssr: {
    categoryIds?: number[];
    provinceIds?: number[];
    institutionId?: number;
    cityIds?: number[];
    page?: number;
  },
): boolean {
  const sameIds = (a?: number[], b?: number[]) =>
    JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
  return (
    !sameIds(browser.filters.categoryIds, ssr.categoryIds)
    || !sameIds(browser.filters.provinceIds, ssr.provinceIds)
    || !sameIds(browser.lockedCityIds, ssr.cityIds)
    || (browser.institutionId ?? null) !== (ssr.institutionId ?? null)
    || browser.page !== (ssr.page ?? 1)
  );
}
