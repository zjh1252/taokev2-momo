/** 展示用课程天数：过滤迁移脏数据（如 201600），必要时用总学时估算 */
export function normalizeCourseDurationDays(
  durationDays?: number,
  totalHours?: number,
): number | null {
  if (durationDays != null && durationDays > 0 && durationDays <= 60) {
    return durationDays;
  }
  if (totalHours != null && totalHours > 0) {
    const hours = Number(totalHours);
    if (Number.isFinite(hours) && hours > 0 && hours <= 480) {
      return Math.max(1, Math.round(hours / 8));
    }
  }
  return null;
}

export function formatPlanStartDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
