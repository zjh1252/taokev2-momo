import { apiGet } from '@/lib/http/client';
import type {
  ApiResponse,
  PageResponse,
  CourseListItem,
  CourseDetail,
  CategoryTreeNode,
} from './types';

export interface CourseListParams {
  page?: number;
  size?: number;
  /** 一级分类 ID 集合（多选） */
  categoryIds?: number[];
  /** 二级分类 ID 集合（多选） */
  subCategoryIds?: number[];
  type?: string;
  isOpen?: boolean;
  keyword?: string;
  sortBy?: string;
  /** 机构 ID 过滤（仅返回该机构发布的课程） */
  institutionId?: number;
  /** 开课省份 ID 集合（按开课计划过滤，多选） */
  provinceIds?: number[];
  /** 开课城市 ID 集合（按开课计划过滤，多选） */
  cityIds?: number[];
  /** 开课时间起（YYYY-MM-DD） */
  startTimeFrom?: string;
  /** 开课时间止（YYYY-MM-DD） */
  startTimeTo?: string;
  /** 时间快捷段：thisWeek / thisMonth / nextThreeMonths */
  timeQuick?: string;
  /** 最低价（含） */
  priceMin?: number;
  /** 最高价（含） */
  priceMax?: number;
  /** 1=仅看免费课程 */
  isFree?: number;
  /** 报名状态：ENROLLING / ENDED */
  enrollStatus?: string;
  /** 内训课：主讲专家擅长行业 */
  trainerIndustryCategoryId?: number;
  /** 内训课：主讲专家省份 */
  trainerProvinceId?: number;
  /** 内训课：主讲专家城市 */
  trainerCityId?: number;
  /** 1=仅看信得过专家 */
  trainerIsTrusted?: number;
  /** 1=仅看独家/版权课讲师 */
  trainerHasCopyright?: number;
}

/**
 * 公开课程列表（分页 + 筛选）
 */
export async function getCourseList(
  params: CourseListParams = {},
): Promise<PageResponse<CourseListItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.categoryIds && params.categoryIds.length > 0) {
    params.categoryIds.forEach((id) => query.append('categoryIds', String(id)));
  }
  if (params.subCategoryIds && params.subCategoryIds.length > 0) {
    params.subCategoryIds.forEach((id) => query.append('subCategoryIds', String(id)));
  }
  if (params.type) query.set('type', params.type);
  if (params.isOpen !== undefined) query.set('isOpen', String(params.isOpen));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.institutionId) query.set('institutionId', String(params.institutionId));
  if (params.provinceIds && params.provinceIds.length > 0) {
    params.provinceIds.forEach((id) => query.append('provinceIds', String(id)));
  }
  if (params.cityIds && params.cityIds.length > 0) {
    params.cityIds.forEach((id) => query.append('cityIds', String(id)));
  }
  if (params.startTimeFrom) query.set('startTimeFrom', params.startTimeFrom);
  if (params.startTimeTo) query.set('startTimeTo', params.startTimeTo);
  if (params.timeQuick) query.set('timeQuick', params.timeQuick);
  if (params.priceMin !== undefined && params.priceMin !== null) {
    query.set('priceMin', String(params.priceMin));
  }
  if (params.priceMax !== undefined && params.priceMax !== null) {
    query.set('priceMax', String(params.priceMax));
  }
  if (params.isFree !== undefined && params.isFree !== null) {
    query.set('isFree', String(params.isFree));
  }
  if (params.enrollStatus) query.set('enrollStatus', params.enrollStatus);
  if (params.trainerIndustryCategoryId) {
    query.set('trainerIndustryCategoryId', String(params.trainerIndustryCategoryId));
  }
  if (params.trainerProvinceId) {
    query.set('trainerProvinceId', String(params.trainerProvinceId));
  }
  if (params.trainerCityId) {
    query.set('trainerCityId', String(params.trainerCityId));
  }
  if (params.trainerIsTrusted !== undefined && params.trainerIsTrusted !== null) {
    query.set('trainerIsTrusted', String(params.trainerIsTrusted));
  }
  if (params.trainerHasCopyright !== undefined && params.trainerHasCopyright !== null) {
    query.set('trainerHasCopyright', String(params.trainerHasCopyright));
  }

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<CourseListItem>>>(
    `/courses${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

/**
 * 课程公开详情
 */
export async function getCourseDetail(id: number): Promise<CourseDetail> {
  const res = await apiGet<ApiResponse<CourseDetail>>(`/courses/${id}`);
  return res.data;
}

/**
 * 获取课程分类树
 */
export async function getCourseCategoryTree(): Promise<CategoryTreeNode[]> {
  const res = await apiGet<ApiResponse<CategoryTreeNode[]>>(
    `/categories/tree?type=COURSE_CATEGORY`,
  );
  return res.data;
}

/**
 * 获取指定类型的分类树（通用）
 */
export async function getCategoryTree(
  type: 'TRAINER_EXPERTISE' | 'TRAINER_INDUSTRY' | 'COURSE_CATEGORY',
): Promise<CategoryTreeNode[]> {
  const res = await apiGet<ApiResponse<CategoryTreeNode[]>>(
    `/categories/tree?type=${type}`,
  );
  return res.data;
}
