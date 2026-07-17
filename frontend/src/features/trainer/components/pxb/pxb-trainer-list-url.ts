import { appendPxbOrigin } from '@/lib/pxb-embed';
import type { TrainerListParams } from '../../types';
import { mapTrainerSortByToApi } from './pxb-trainer-sort';

export type PxbTrainerQuality = 'all' | 'premium';

export interface PxbTrainerListUrlState {
  page: number;
  keyword: string;
  expertiseCategoryId?: number;
  industryCategoryId?: number;
  provinceId?: number;
  cityId?: number;
  quality: PxbTrainerQuality;
  sortBy: string;
}

export const DEFAULT_PXB_TRAINER_LIST_STATE: PxbTrainerListUrlState = {
  page: 1,
  keyword: '',
  quality: 'all',
  sortBy: 'default',
};

export function parsePxbTrainerListUrl(searchParams: URLSearchParams): PxbTrainerListUrlState {
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
  const num = (key: string) => {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const qualityRaw = searchParams.get('quality');
  const quality: PxbTrainerQuality = qualityRaw === 'premium' ? 'premium' : 'all';
  return {
    page,
    keyword: searchParams.get('keyword')?.trim() ?? '',
    expertiseCategoryId: num('expertiseCategoryId'),
    industryCategoryId: num('industryCategoryId'),
    provinceId: num('provinceId'),
    cityId: num('cityId'),
    quality,
    sortBy: searchParams.get('sortBy') || 'default',
  };
}

export function buildPxbTrainerListSearchParams(state: PxbTrainerListUrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set('page', String(state.page));
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.expertiseCategoryId) params.set('expertiseCategoryId', String(state.expertiseCategoryId));
  if (state.industryCategoryId) params.set('industryCategoryId', String(state.industryCategoryId));
  if (state.provinceId) params.set('provinceId', String(state.provinceId));
  if (state.cityId) params.set('cityId', String(state.cityId));
  if (state.quality === 'premium') params.set('quality', 'premium');
  if (state.sortBy && state.sortBy !== 'default') params.set('sortBy', state.sortBy);
  return appendPxbOrigin(params);
}

export function replacePxbTrainerListUrl(state: PxbTrainerListUrlState) {
  const qs = buildPxbTrainerListSearchParams(state).toString();
  window.history.replaceState(null, '', `/trainer?${qs}`);
}

export function pxbTrainerListParams(state: PxbTrainerListUrlState): TrainerListParams {
  return {
    page: state.page,
    size: 15,
    expertiseCategoryId: state.expertiseCategoryId,
    industryCategoryId: state.industryCategoryId,
    provinceId: state.provinceId,
    cityId: state.cityId,
    keyword: state.keyword || undefined,
    sort: mapTrainerSortByToApi(state.sortBy),
    isTrusted: state.quality === 'premium' ? 1 : undefined,
    includeCourse: true,
  };
}
