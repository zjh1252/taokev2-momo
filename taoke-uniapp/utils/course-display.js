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

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** 期次/开课时间 — YYYY-MM-DD HH:mm（阿拉伯数字，零填充） */
export function formatPlanDateTime(value) {
  if (!value) return '-';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatPlanStartDate(value) {
  return formatPlanDateTime(value);
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
