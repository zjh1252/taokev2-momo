/** 展示用课程天数：过滤迁移脏数据，必要时用总学时估算 */
export function normalizeCourseDurationDays(durationDays, totalHours) {
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

export function formatPlanStartDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export function formatKeywords(keywords) {
  if (!keywords) return [];
  return String(keywords)
    .split(/[,，、\s]+/)
    .map((kw) => kw.trim())
    .filter(Boolean);
}

export function formatCaseDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** 运营位 title 可能是封面 URL，展示标题优先 resourceName */
export function isLikelyUrl(value) {
  return /^(https?:|\/\/)/i.test(String(value || '').trim());
}

export function pickResourceDisplayTitle(item) {
  const name = String(item?.resourceName || item?.name || '').trim();
  if (name && !isLikelyUrl(name)) return name;
  const title = String(item?.title || '').trim();
  if (title && !isLikelyUrl(title)) return title;
  return '';
}
