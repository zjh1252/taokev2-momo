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

const TIME_QUICK_LABELS: Record<string, string> = {
  thisWeek: '本周内',
  thisMonth: '本月内',
  nextThreeMonths: '近三个月',
};

function parsePositiveIntList(values: string[]): number[] {
  return values
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
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

  const timeQuick = params.get('timeQuick') || undefined;
  const timeQuickLabel =
    params.get('timeQuickLabel')
    || (timeQuick ? TIME_QUICK_LABELS[timeQuick] : undefined);
  const startTimeFrom = params.get('startTimeFrom') || undefined;
  const startTimeTo = params.get('startTimeTo') || undefined;
  const priceLabel = params.get('priceLabel') || undefined;
  const priceMin = parseOptionalNumber(params.get('priceMin'));
  const priceMax = parseOptionalNumber(params.get('priceMax'));
  const isFree = parseOptionalNumber(params.get('isFree'));

  return {
    filters: {
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      categoryNames: categoryNames.length > 0 ? categoryNames : undefined,
      provinceIds: provinceIds.length > 0 ? provinceIds : undefined,
      provinceNames: provinceNames.length > 0 ? provinceNames : undefined,
      timeQuick,
      timeQuickLabel,
      startTimeFrom,
      startTimeTo,
      priceLabel,
      priceMin,
      priceMax,
      isFree,
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

function hasTimeOrPriceFilter(f: OpenCourseFilterValue): boolean {
  return Boolean(
    f.timeQuick
    || f.startTimeFrom
    || f.startTimeTo
    || f.priceLabel
    || f.priceMin !== undefined
    || f.priceMax !== undefined
    || f.isFree !== undefined,
  );
}

export function hasOpenCourseBrowserFilter(state: OpenCourseBrowserState): boolean {
  return (
    (state.filters.categoryIds?.length ?? 0) > 0
    || (state.filters.provinceIds?.length ?? 0) > 0
    || (state.lockedCityIds?.length ?? 0) > 0
    || state.institutionId != null
    || hasTimeOrPriceFilter(state.filters)
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
    timeQuick?: string;
    startTimeFrom?: string;
    startTimeTo?: string;
    priceMin?: number;
    priceMax?: number;
    isFree?: number;
  },
): boolean {
  const sameIds = (a?: number[], b?: number[]) =>
    JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
  return (
    !sameIds(browser.filters.categoryIds, ssr.categoryIds)
    || !sameIds(browser.filters.provinceIds, ssr.provinceIds)
    || !sameIds(browser.lockedCityIds, ssr.cityIds)
    || (browser.institutionId ?? null) !== (ssr.institutionId ?? null)
    || (browser.filters.timeQuick ?? null) !== (ssr.timeQuick ?? null)
    || (browser.filters.startTimeFrom ?? null) !== (ssr.startTimeFrom ?? null)
    || (browser.filters.startTimeTo ?? null) !== (ssr.startTimeTo ?? null)
    || (browser.filters.priceMin ?? null) !== (ssr.priceMin ?? null)
    || (browser.filters.priceMax ?? null) !== (ssr.priceMax ?? null)
    || (browser.filters.isFree ?? null) !== (ssr.isFree ?? null)
    || browser.page !== (ssr.page ?? 1)
  );
}

/** 将时间/价格筛选追加到 URLSearchParams（供 syncUrl 复用） */
export function appendOpenCourseTimePriceParams(
  params: URLSearchParams,
  f: OpenCourseFilterValue,
): void {
  if (f.timeQuick) params.set('timeQuick', f.timeQuick);
  if (f.timeQuickLabel) params.set('timeQuickLabel', f.timeQuickLabel);
  if (f.startTimeFrom) params.set('startTimeFrom', f.startTimeFrom);
  if (f.startTimeTo) params.set('startTimeTo', f.startTimeTo);
  if (f.priceLabel) params.set('priceLabel', f.priceLabel);
  if (f.priceMin !== undefined && f.priceMin !== null) {
    params.set('priceMin', String(f.priceMin));
  }
  if (f.priceMax !== undefined && f.priceMax !== null) {
    params.set('priceMax', String(f.priceMax));
  }
  if (f.isFree !== undefined && f.isFree !== null) {
    params.set('isFree', String(f.isFree));
  }
}
