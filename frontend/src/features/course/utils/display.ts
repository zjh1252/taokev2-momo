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

function toEpochMs(value?: string | number | null): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  // 后端 Jackson：yyyy-MM-dd HH:mm:ss → 转为可解析的 ISO 形态
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** 将详情接口返回的 serverTime 转为毫秒时间戳 */
export function serverTimeToMs(serverTime?: string | null): number | null {
  return toEpochMs(serverTime);
}

/**
 * 开课计划是否仍可报名。
 * <p>
 * 规则（与业务一致）：以「课程结束时间」对比服务器时间 —
 * {@code now <= endTime} → 招生中；{@code now > endTime} → 已结束。
 * 开始时间晚于结束时间的脏数据直接视为已结束。
 * </p>
 *
 * @param nowMs 服务器当前时间毫秒；不传时仅作兜底（应尽量传入详情接口的 serverTime）
 */
export function isPlanEnrolling(
  plan: { startTime?: string | null; endTime?: string | null },
  nowMs?: number | null,
): boolean {
  const endMs = toEpochMs(plan.endTime);
  if (endMs == null) return false;

  const startMs = toEpochMs(plan.startTime);
  if (startMs != null && startMs > endMs) {
    return false;
  }

  const now = nowMs != null && Number.isFinite(nowMs) ? nowMs : Date.now();
  return now <= endMs;
}
