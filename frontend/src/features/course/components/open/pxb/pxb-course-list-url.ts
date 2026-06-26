import { appendPxbOrigin } from '@/lib/pxb-embed';
import type { CourseListParams } from '../../../api/service';
import {
  type PxbCourseListConfig,
  resolvePricePresetFromConfig,
} from './config/pxb-course-list-config';
import { mapSortByToApi } from './pxb-sort';

export interface PxbCourseListUrlState {
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

export const DEFAULT_PXB_COURSE_LIST_STATE: PxbCourseListUrlState = {
  page: 1,
  keyword: '',
  sortBy: 'default',
};

export function parsePxbCourseListUrl(
  searchParams: URLSearchParams,
): PxbCourseListUrlState {
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

export function buildPxbCourseListSearchParams(
  state: PxbCourseListUrlState,
  config: PxbCourseListConfig,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set('page', String(state.page));
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.categoryId) params.set('categoryId', String(state.categoryId));
  if (state.subCategoryId) params.set('subCategoryId', String(state.subCategoryId));
  if (state.provinceId) params.set('provinceId', String(state.provinceId));
  if (state.cityId) params.set('cityId', String(state.cityId));
  if (config.showTimeFilter && state.timeQuick) params.set('timeQuick', state.timeQuick);
  if (config.showTimeFilter && state.startTimeFrom) params.set('startTimeFrom', state.startTimeFrom);
  if (config.showTimeFilter && state.startTimeTo) params.set('startTimeTo', state.startTimeTo);
  if (state.pricePreset) params.set('pricePreset', state.pricePreset);
  if (state.priceMin != null) params.set('priceMin', String(state.priceMin));
  if (state.priceMax != null) params.set('priceMax', String(state.priceMax));
  if (state.minScore != null) params.set('minScore', String(state.minScore));
  if (config.showEnrollStatus && state.enrollStatus) {
    params.set('enrollStatus', state.enrollStatus);
  }
  if (state.sortBy && state.sortBy !== 'default') params.set('sortBy', state.sortBy);
  return appendPxbOrigin(params);
}

export function replacePxbCourseListUrl(
  state: PxbCourseListUrlState,
  config: PxbCourseListConfig,
) {
  const qs = buildPxbCourseListSearchParams(state, config).toString();
  window.history.replaceState(null, '', `${config.basePath}?${qs}`);
}

export function pxbCourseListParams(
  state: PxbCourseListUrlState,
  config: PxbCourseListConfig,
): CourseListParams {
  const priceFromPreset = resolvePricePresetFromConfig(config, state.pricePreset);
  const timeQuick =
    config.showTimeFilter && state.timeQuick && state.timeQuick !== 'nextSixMonths'
      ? state.timeQuick
      : undefined;

  const base: CourseListParams = {
    page: state.page,
    size: 15,
    isOpen: config.isOpen,
    keyword: state.keyword || undefined,
    categoryIds: state.categoryId ? [state.categoryId] : undefined,
    subCategoryIds: state.subCategoryId ? [state.subCategoryId] : undefined,
    priceMin: state.priceMin ?? priceFromPreset?.priceMin,
    priceMax: state.priceMax ?? priceFromPreset?.priceMax,
    minScore: state.minScore,
    sortBy: mapSortByToApi(state.sortBy),
  };

  if (config.locationMode === 'plan') {
    base.provinceIds = state.provinceId ? [state.provinceId] : undefined;
    base.cityIds = state.cityId ? [state.cityId] : undefined;
    base.timeQuick = timeQuick;
    base.startTimeFrom = state.startTimeFrom;
    base.startTimeTo = state.startTimeTo;
    base.enrollStatus = state.enrollStatus;
  } else {
    base.trainerProvinceId = state.provinceId;
    base.trainerCityId = state.cityId;
  }

  return base;
}
