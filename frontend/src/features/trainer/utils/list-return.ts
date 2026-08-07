import { parseSlug, parseTrainerListPathname, type TrainerSlugParams } from './url';

/** 专家列表页返回路径（详情页面包屑 / 返回时恢复筛选与页码） */
export const TRAINER_LIST_RETURN_KEY = 'taoke:trainer:list:return';
/** 离开列表进入详情前的滚动位置 */
export const TRAINER_LIST_SCROLL_KEY = 'taoke:trainer:list:scroll';

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

/** 规范化列表路径：去掉 locale 前缀，保证面包屑/返回可被 proxy 正确 rewrite */
export function normalizeTrainerListPath(path: string): string {
  const [pathnamePart, search = ''] = path.split('?');
  const pathname = pathnamePart.replace(/^\/(zh-CN|en)(?=\/|$)/, '') || '/trainer';
  const q = search ? `?${search}` : '';
  return `${pathname}${q}`;
}

export function rememberTrainerListPath(path?: string): void {
  if (typeof window === 'undefined') return;
  const raw = path ?? `${window.location.pathname}${window.location.search}`;
  const value = normalizeTrainerListPath(raw);
  if (!isSafeTrainerListPath(value)) return;
  try {
    sessionStorage.setItem(TRAINER_LIST_RETURN_KEY, value);
  } catch {
    // ignore quota / private mode
  }
}

export function readTrainerListReturnPath(fallback = '/trainer'): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = sessionStorage.getItem(TRAINER_LIST_RETURN_KEY);
    if (saved) {
      const normalized = normalizeTrainerListPath(saved);
      if (isSafeTrainerListPath(normalized)) return normalized;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function rememberTrainerListScroll(scrollY?: number): void {
  if (typeof window === 'undefined') return;
  const y = scrollY ?? window.scrollY;
  if (!Number.isFinite(y) || y < 0) return;
  try {
    sessionStorage.setItem(TRAINER_LIST_SCROLL_KEY, String(Math.round(y)));
  } catch {
    // ignore
  }
}

/** 读取并清除滚动位置（仅详情返回时消费一次） */
export function consumeTrainerListScroll(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(TRAINER_LIST_SCROLL_KEY);
    if (raw == null) return null;
    sessionStorage.removeItem(TRAINER_LIST_SCROLL_KEY);
    const y = Number(raw);
    return Number.isFinite(y) && y > 0 ? y : null;
  } catch {
    return null;
  }
}

export function hasTrainerSlugState(slug: TrainerSlugParams): boolean {
  return Boolean(
    slug.field
    || slug.industry
    || slug.region
    || (slug.page != null && slug.page > 1),
  );
}

/**
 * 从当前地址栏解析专家列表状态。
 * 优先 .htm SEO 路径（/trainer/page=2.htm），其次兼容 ?page=&field= 查询参数。
 */
export function readTrainerListSlugFromBrowser(): TrainerSlugParams {
  if (typeof window === 'undefined') return {};
  const fromPath = parseTrainerListPathname(window.location.pathname);
  if (hasTrainerSlugState(fromPath) || window.location.pathname.includes('.htm')) {
    return fromPath;
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = parseSlug(
    [
      params.get('field') ? `field=${params.get('field')}` : '',
      params.get('industry') ? `industry=${params.get('industry')}` : '',
      params.get('region') ? `region=${params.get('region')}` : '',
      params.get('page') ? `page=${params.get('page')}` : '',
    ]
      .filter(Boolean)
      .join('&'),
  );

  // 地址栏无状态时，回退到进入详情前记住的列表路径
  if (!hasTrainerSlugState(fromQuery)) {
    const saved = readTrainerListReturnPath('');
    if (saved) {
      const [pathname, search = ''] = saved.split('?');
      const savedPath = parseTrainerListPathname(pathname);
      if (hasTrainerSlugState(savedPath)) return savedPath;
      if (search) {
        const sp = new URLSearchParams(search);
        return parseSlug(
          [
            sp.get('field') ? `field=${sp.get('field')}` : '',
            sp.get('industry') ? `industry=${sp.get('industry')}` : '',
            sp.get('region') ? `region=${sp.get('region')}` : '',
            sp.get('page') ? `page=${sp.get('page')}` : '',
          ]
            .filter(Boolean)
            .join('&'),
        );
      }
    }
  }

  return fromQuery;
}
