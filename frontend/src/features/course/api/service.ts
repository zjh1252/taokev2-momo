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
  categoryId?: number;
  subCategoryId?: number;
  type?: string;
  isOpen?: boolean;
  keyword?: string;
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
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
  if (params.subCategoryId) query.set('subCategoryId', String(params.subCategoryId));
  if (params.type) query.set('type', params.type);
  if (params.isOpen !== undefined) query.set('isOpen', String(params.isOpen));
  if (params.keyword) query.set('keyword', params.keyword);

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
