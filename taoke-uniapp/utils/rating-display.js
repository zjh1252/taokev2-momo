/** 评分展示规则 — 对齐 PDF4 测试与 PC */

export const RATING_LOW_THRESHOLD = 3;

export function parseScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 专家：低于 3.0 显示「未评价」 */
export function formatExpertRating(score) {
  const value = parseScore(score);
  if (value <= 0 || value < RATING_LOW_THRESHOLD) {
    return { showStars: false, label: '未评价', value: 0 };
  }
  return {
    showStars: true,
    label: value.toFixed(1),
    value,
    starCount: Math.round(value),
  };
}

/** 课程：低于 3.0 显示「暂无评分」 */
export function formatCourseRating(score) {
  const value = parseScore(score);
  if (value <= 0 || value < RATING_LOW_THRESHOLD) {
    return { showStars: false, label: '暂无评分', value: 0 };
  }
  return {
    showStars: true,
    label: value.toFixed(1),
    value,
    starCount: Math.round(value),
  };
}
