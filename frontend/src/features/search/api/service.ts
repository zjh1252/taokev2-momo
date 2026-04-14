import { apiGet } from '@/lib/http/client';
import type {
  ApiResponse,
  PageResponse,
  SearchParams,
  SearchResultItem,
  SearchTab
} from './types';

/**
 * 将前端 tab 映射为后端搜索参数
 */
export function tabToSearchParams(tab: SearchTab): Pick<SearchParams, 'docType' | 'courseType'> {
  switch (tab) {
    case 'trainer':
      return { docType: 'trainer' };
    case 'openCourse':
      return { docType: 'course', courseType: ['OPEN_OFFLINE', 'OPEN_ONLINE'] };
    case 'innerCourse':
      return { docType: 'course', courseType: ['INTERNAL'] };
  }
}

/**
 * 全文搜索
 */
export async function searchDocuments(
  params: SearchParams
): Promise<PageResponse<SearchResultItem>> {
  const query = new URLSearchParams();

  if (params.keyword) query.set('keyword', params.keyword);
  if (params.docType) query.set('docType', params.docType);
  if (params.courseType?.length) {
    params.courseType.forEach((t) => query.append('courseType', t));
  }
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
  if (params.subCategoryId) query.set('subCategoryId', String(params.subCategoryId));
  if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
  if (params.durationDays) query.set('durationDays', String(params.durationDays));
  if (params.provinceId) query.set('provinceId', String(params.provinceId));
  if (params.cityId) query.set('cityId', String(params.cityId));
  if (params.minExperienceYears) query.set('minExperienceYears', String(params.minExperienceYears));
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<SearchResultItem>>>(
    `/search${qs ? `?${qs}` : ''}`
  );
  return res.data;
}
