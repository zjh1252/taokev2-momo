import type { CourseType } from '../api/types';
import { resolveOpenCourseSeoPathId } from './open-course-seo';

export function isOpenCourseType(type?: CourseType | string | null): boolean {
  return type === 'OPEN_OFFLINE' || type === 'OPEN_ONLINE';
}

/** C 端课程详情页路径（无 /courses/[id] 公开路由） */
export function getCourseDetailPath(
  id: number,
  type?: CourseType | string | null,
  seoPathId?: number | null,
): string {
  if (isOpenCourseType(type)) {
    const pathId = resolveOpenCourseSeoPathId({ id, seoPathId });
    return `/opencourse/${pathId}.htm`;
  }
  return `/inhousecourse/${id}.htm`;
}

export { formatPlanCode, getOpenCoursePlanPath, parsePlanCode } from './plan-code';
export {
  formatOpenCourseNo,
  getOpenCoursePlanSeoPath,
  getPlanDisplayNo,
  resolveOpenCourseDisplayNo,
  resolveOpenCourseSeoPathId,
} from './open-course-seo';
