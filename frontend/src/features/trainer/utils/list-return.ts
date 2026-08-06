/** 专家列表页返回路径（详情页面包屑 / 返回时恢复筛选与页码） */
export const TRAINER_LIST_RETURN_KEY = 'taoke:trainer:list:return';
export const TRAINER_LIST_RETURN_PARAM = 'from';

/** 仅允许本站专家列表路径，防止脏数据跳转 */
export function isSafeTrainerListPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  // /trainer 或 /trainer/....htm（筛选/分页），排除详情 /trainer/123.htm
  if (path === '/trainer' || path.startsWith('/trainer?')) return true;
  if (/^\/trainer\/\d+(\/|\.htm|$)/.test(path)) return false;
  if (path.startsWith('/trainer/') && path.includes('.htm')) return true;
  if (path.startsWith('/city/') && path.includes('/trainers')) return true;
  return false;
}

export function rememberTrainerListPath(path?: string): void {
  if (typeof window === 'undefined') return;
  const value = path ?? `${window.location.pathname}${window.location.search}`;
  if (!isSafeTrainerListPath(value)) return;
  try {
    sessionStorage.setItem(TRAINER_LIST_RETURN_KEY, value);
  } catch {
    // ignore quota / private mode
  }
}

export function parseTrainerListReturnParam(
  value?: string | string[] | null,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep the already-decoded value
  }

  return isSafeTrainerListPath(decoded) ? decoded : null;
}

export function appendTrainerListReturnParam(
  href: string,
  listReturnPath?: string | null,
): string {
  const safeReturnPath = parseTrainerListReturnParam(listReturnPath);
  if (!safeReturnPath) return href;

  try {
    const url = new URL(href, 'https://taoke.local');
    url.searchParams.set(TRAINER_LIST_RETURN_PARAM, safeReturnPath);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

export function readTrainerListReturnPath(fallback = '/trainer'): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = sessionStorage.getItem(TRAINER_LIST_RETURN_KEY);
    if (saved && isSafeTrainerListPath(saved)) return saved;
  } catch {
    // ignore
  }
  return fallback;
}
