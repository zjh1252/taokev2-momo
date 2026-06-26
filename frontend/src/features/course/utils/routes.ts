import type { CourseType } from '../api/types';

export function isOpenCourseType(type?: CourseType | string | null): boolean {
  return type === 'OPEN_OFFLINE' || type === 'OPEN_ONLINE';
}

/** C 端课程详情页路径（无 /courses/[id] 公开路由） */
export function getCourseDetailPath(id: number, type?: CourseType | string | null): string {
  return isOpenCourseType(type) ? `/opencourse/${id}.htm` : `/inhousecourse/${id}.htm`;
}

export { formatPlanCode, getOpenCoursePlanPath, parsePlanCode } from './plan-code';
