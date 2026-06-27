import { appendPxbOrigin } from '@/lib/pxb-embed';
import type { InstitutionListParams } from '../../api/service';
import { mapInstitutionSortByToApi, PXB_INSTITUTION_LIST_PATH } from './pxb-institution-sort';

export interface PxbInstitutionListUrlState {
  page: number;
  keyword: string;
  expertiseCategoryId?: number;
  industryCategoryId?: number;
  provinceId?: number;
  cityId?: number;
  sortBy: string;
}

export const DEFAULT_PXB_INSTITUTION_LIST_STATE: PxbInstitutionListUrlState = {
  page: 1,
  keyword: '',
  sortBy: 'default',
};

export function parsePxbInstitutionListUrl(searchParams: URLSearchParams): PxbInstitutionListUrlState {
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
    expertiseCategoryId: num('expertiseCategoryId'),
    industryCategoryId: num('industryCategoryId'),
    provinceId: num('provinceId'),
    cityId: num('cityId'),
    sortBy: searchParams.get('sortBy') || 'default',
  };
}

export function buildPxbInstitutionListSearchParams(state: PxbInstitutionListUrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set('page', String(state.page));
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.expertiseCategoryId) params.set('expertiseCategoryId', String(state.expertiseCategoryId));
  if (state.industryCategoryId) params.set('industryCategoryId', String(state.industryCategoryId));
  if (state.provinceId) params.set('provinceId', String(state.provinceId));
  if (state.cityId) params.set('cityId', String(state.cityId));
  if (state.sortBy && state.sortBy !== 'default') params.set('sortBy', state.sortBy);
  return appendPxbOrigin(params);
}

export function replacePxbInstitutionListUrl(state: PxbInstitutionListUrlState) {
  const qs = buildPxbInstitutionListSearchParams(state).toString();
  window.history.replaceState(null, '', `${PXB_INSTITUTION_LIST_PATH}?${qs}`);
}

export function pxbInstitutionListParams(state: PxbInstitutionListUrlState): InstitutionListParams {
  return {
    page: state.page,
    size: 15,
    expertiseCategoryId: state.expertiseCategoryId,
    industryCategoryId: state.industryCategoryId,
    provinceId: state.provinceId,
    cityId: state.cityId,
    keyword: state.keyword || undefined,
    sort: mapInstitutionSortByToApi(state.sortBy),
  };
}
