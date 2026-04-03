import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  CourseFilters,
  PlanFilters,
  CoursesResponse,
  PlansResponse
} from './types';
import { buildCourseParams, buildPlanParams } from './service';

/** 服务端预取：课程列表 */
export async function getCoursesFromServer(
  filters: CourseFilters
): Promise<CoursesResponse> {
  const params = buildCourseParams(filters);
  return serverFetch(
    `/admin/courses?${params.toString()}`
  ) as Promise<CoursesResponse>;
}

/** 服务端预取：排课计划列表 */
export async function getPlansFromServer(
  filters: PlanFilters
): Promise<PlansResponse> {
  const params = buildPlanParams(filters);
  return serverFetch(
    `/admin/courses/plans?${params.toString()}`
  ) as Promise<PlansResponse>;
}
