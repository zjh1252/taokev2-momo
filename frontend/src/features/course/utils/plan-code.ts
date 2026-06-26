const PLAN_CODE_RE = /^TK-(\d+)-(\d+)$/;

/** 生成开课计划编号，如 TK-000015-1 */
export function formatPlanCode(courseId: number, sequence: number): string {
  return `TK-${String(courseId).padStart(6, '0')}-${sequence}`;
}

/** 解析开课计划编号，sequence 为 1-based */
export function parsePlanCode(
  code: string,
): { courseId: number; planIndex: number } | null {
  const match = PLAN_CODE_RE.exec(code.trim());
  if (!match) return null;
  const courseId = Number(match[1]);
  const planIndex = Number(match[2]);
  if (!Number.isFinite(courseId) || !Number.isFinite(planIndex) || planIndex < 1) {
    return null;
  }
  return { courseId, planIndex };
}

/** 公开课开课计划详情页 SEO 路径 */
export function getOpenCoursePlanPath(planCode: string): string {
  return `/opencourse/${planCode}.htm`;
}
