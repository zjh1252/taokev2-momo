import type { CourseType } from '../api/types';

export interface OpenCourseSeoSource {
  id: number;
  seoPathId?: number | null;
  displayCourseNo?: number | null;
  plans?: Array<{ sortOrder?: number | null; startTime?: string | null }> | null;
}

export interface PlanSeoSource {
  sortOrder?: number | null;
}

/** 纯数字课程编号文案（不加 TK-、不补零） */
export function formatOpenCourseNo(no: number): string {
  return String(no);
}

/** 公开课 SEO URL 数字段：优先 seoPathId，否则从 plans 推最近 legacy，再回退 id */
export function resolveOpenCourseSeoPathId(course: OpenCourseSeoSource): number {
  if (course.seoPathId != null && course.seoPathId > 0) {
    return course.seoPathId;
  }
  const fromPlans = pickLegacyPlanSortOrder(course.plans);
  if (fromPlans != null) {
    return fromPlans;
  }
  return course.id;
}

/** Hero 展示编号：pathId 命中场次 > displayCourseNo > seo/plans > id */
export function resolveOpenCourseDisplayNo(
  course: OpenCourseSeoSource,
  pathId?: number | null,
): number {
  if (pathId != null && pathId > 0) {
    const hit = course.plans?.some((p) => p.sortOrder === pathId);
    if (hit) {
      return pathId;
    }
  }
  if (course.displayCourseNo != null && course.displayCourseNo > 0) {
    return course.displayCourseNo;
  }
  return resolveOpenCourseSeoPathId(course);
}

export function getPlanDisplayNo(
  plan: PlanSeoSource,
  courseId: number,
  _index1Based: number,
): string {
  if (plan.sortOrder != null && plan.sortOrder > 0) {
    return formatOpenCourseNo(plan.sortOrder);
  }
  return formatOpenCourseNo(courseId);
}

export function getOpenCoursePlanSeoPath(
  plan: PlanSeoSource,
  courseId: number,
  index1Based: number,
): string {
  const no =
    plan.sortOrder != null && plan.sortOrder > 0 ? plan.sortOrder : courseId;
  // index1Based 保留签名兼容旧调用；对外主链用纯数字
  void index1Based;
  return `/opencourse/${no}.htm`;
}

function pickLegacyPlanSortOrder(
  plans?: Array<{ sortOrder?: number | null; startTime?: string | null }> | null,
): number | null {
  if (!plans?.length) return null;
  const now = Date.now();
  const withLegacy = plans.filter((p) => p.sortOrder != null && p.sortOrder > 0);
  if (withLegacy.length === 0) return null;
  const upcoming = withLegacy
    .filter((p) => p.startTime && new Date(p.startTime).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime(),
    );
  if (upcoming.length > 0) return upcoming[0].sortOrder!;
  const past = [...withLegacy].sort((a, b) => {
    const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
    const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
    return tb - ta;
  });
  return past[0].sortOrder!;
}
