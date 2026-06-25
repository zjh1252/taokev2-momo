import { appendPxbOrigin } from '@/lib/pxb-embed';
import { mapSortByToApi } from './pxb-sort';

export interface PxbOpenCourseUrlState {
  page: number;
  keyword: string;
  categoryId?: number;
  subCategoryId?: number;
  provinceId?: number;
  cityId?: number;
  timeQuick?: string;
  startTimeFrom?: string;
  startTimeTo?: string;
  pricePreset?: string;
  priceMin?: number;
  priceMax?: number;
  minScore?: number;
  enrollStatus?: string;
  sortBy: string;
}

const DEFAULT_STATE: PxbOpenCourseUrlState = {
  page: 1,
  keyword: '',
  sortBy: 'default',
};

export function parsePxbOpenCourseUrl(
  searchParams: URLSearchParams,
): PxbOpenCourseUrlState {
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
  const num = (key: string) => {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    page,
    keyword: searchParams.get('keyword')?.trim() ?? '',
    categoryId: num('categoryId'),
    subCategoryId: num('subCategoryId'),
    provinceId: num('provinceId'),
    cityId: num('cityId'),
    timeQuick: searchParams.get('timeQuick') || undefined,
    startTimeFrom: searchParams.get('startTimeFrom') || undefined,
    startTimeTo: searchParams.get('startTimeTo') || undefined,
    pricePreset: searchParams.get('pricePreset') || undefined,
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    minScore: num('minScore'),
    enrollStatus: searchParams.get('enrollStatus') || undefined,
    sortBy: searchParams.get('sortBy') || 'default',
  };
}

export function buildPxbOpenCourseSearchParams(
  state: PxbOpenCourseUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set('page', String(state.page));
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.categoryId) params.set('categoryId', String(state.categoryId));
  if (state.subCategoryId) params.set('subCategoryId', String(state.subCategoryId));
  if (state.provinceId) params.set('provinceId', String(state.provinceId));
  if (state.cityId) params.set('cityId', String(state.cityId));
  if (state.timeQuick) params.set('timeQuick', state.timeQuick);
  if (state.startTimeFrom) params.set('startTimeFrom', state.startTimeFrom);
  if (state.startTimeTo) params.set('startTimeTo', state.startTimeTo);
  if (state.pricePreset) params.set('pricePreset', state.pricePreset);
  if (state.priceMin != null) params.set('priceMin', String(state.priceMin));
  if (state.priceMax != null) params.set('priceMax', String(state.priceMax));
  if (state.minScore != null) params.set('minScore', String(state.minScore));
  if (state.enrollStatus) params.set('enrollStatus', state.enrollStatus);
  if (state.sortBy && state.sortBy !== 'default') params.set('sortBy', state.sortBy);
  return appendPxbOrigin(params);
}

export function replacePxbOpenCourseUrl(state: PxbOpenCourseUrlState) {
  const qs = buildPxbOpenCourseSearchParams(state).toString();
  window.history.replaceState(null, '', `/opencourse?${qs}`);
}

export function pxbOpenCourseListParams(state: PxbOpenCourseUrlState) {
  const priceFromPreset = resolvePricePreset(state.pricePreset);
  const timeQuick =
    state.timeQuick && state.timeQuick !== 'nextSixMonths'
      ? state.timeQuick
      : undefined;
  return {
    page: state.page,
    size: 15,
    isOpen: true as const,
    keyword: state.keyword || undefined,
    categoryIds: state.categoryId ? [state.categoryId] : undefined,
    subCategoryIds: state.subCategoryId ? [state.subCategoryId] : undefined,
    provinceIds: state.provinceId ? [state.provinceId] : undefined,
    cityIds: state.cityId ? [state.cityId] : undefined,
    timeQuick,
    startTimeFrom: state.startTimeFrom,
    startTimeTo: state.startTimeTo,
    priceMin: state.priceMin ?? priceFromPreset?.priceMin,
    priceMax: state.priceMax ?? priceFromPreset?.priceMax,
    minScore: state.minScore,
    enrollStatus: state.enrollStatus,
    sortBy: mapSortByToApi(state.sortBy),
  };
}

function resolvePricePreset(preset?: string) {
  switch (preset) {
    case '1':
      return { priceMax: 2000 };
    case '2':
      return { priceMin: 2001, priceMax: 5000 };
    case '3':
      return { priceMin: 5001, priceMax: 10000 };
    case '4':
      return { priceMin: 10000 };
    default:
      return undefined;
  }
}

export { DEFAULT_STATE };
