import { apiClient } from '@/lib/api-client';
import type {
  CourseFilters,
  PlanFilters,
  CoursesResponse,
  PlansResponse,
  CourseDetailResponse
} from './types';

export function buildCourseParams(filters: CourseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  return params;
}

export function buildPlanParams(filters: PlanFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.courseId) params.set('courseId', String(filters.courseId));
  return params;
}

/** 客户端：课程列表 */
export async function getCourses(
  filters: CourseFilters
): Promise<CoursesResponse> {
  const params = buildCourseParams(filters);
  return apiClient<CoursesResponse>(`/courses?${params.toString()}`);
}

/** 客户端：课程详情 */
export async function getCourseDetail(id: number): Promise<CourseDetailResponse> {
  return apiClient<CourseDetailResponse>(`/courses/${id}`);
}

/** 客户端：排课计划列表 */
export async function getCoursePlans(
  filters: PlanFilters
): Promise<PlansResponse> {
  const params = buildPlanParams(filters);
  return apiClient<PlansResponse>(`/courses/plans?${params.toString()}`);
}

/** 审核通过 */
export async function approveCourse(courseId: number) {
  return apiClient<{ code: number; message: string }>(
    `/courses/${courseId}/approve`,
    { method: 'PUT' }
  );
}

/** 审核驳回 */
export async function rejectCourse(courseId: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/courses/${courseId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

/** 下架课程 */
export async function unpublishCourse(courseId: number) {
  return apiClient<{ code: number; message: string }>(
    `/courses/${courseId}/unpublish`,
    { method: 'PUT' }
  );
}

/** 设为/取消主打 */
export async function toggleFeatured(courseId: number) {
  return apiClient<{ code: number; message: string }>(
    `/courses/${courseId}/feature`,
    { method: 'PUT' }
  );
}
