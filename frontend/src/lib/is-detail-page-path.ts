import { ROUTES } from '@/config/routes';

const TRAINER_SECTIONS = new Set(['courses', 'cases', 'video', 'comment', 'book']);

/** 内部 App Router 段名 → SEO pathname 前缀 */
const INTERNAL_TO_SEO_BASE: Record<string, string> = {
  innercourses: ROUTES.INTERNAL_COURSES.slice(1),
  opencourses: ROUTES.PUBLIC_COURSES.slice(1),
  trainers: ROUTES.TRAINERS.slice(1),
  institutions: ROUTES.INSTITUTIONS.slice(1),
  associations: ROUTES.ASSOCIATIONS.slice(1),
  videos: 'video',
  vedio: 'video', // 老站录播课 SEO 拼写（列表卡片仍用 /vedio/{id}.htm）
  cases: 'case',
};

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const segments = withoutQuery.split('/').filter(Boolean).map((seg) => seg.replace(/\.htm$/i, ''));
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

/** 将 /innercourses/123 转为 /inhousecourse/123，便于统一判定 */
function toSeoPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return '/';

  const [first, ...rest] = segments;
  const seoFirst = INTERNAL_TO_SEO_BASE[first];
  if (!seoFirst) return path;

  return `/${[seoFirst, ...rest].join('/')}`;
}

function isTrainerDetailPath(pathname: string): boolean {
  const base = ROUTES.TRAINERS;
  if (!pathname.startsWith(`${base}/`)) return false;
  const rest = pathname.slice(base.length + 1);
  if (!rest) return false;

  const parts = rest.split('/').filter(Boolean);
  if (parts.length === 1) return isNumericId(parts[0]);

  if (!isNumericId(parts[0])) return false;
  if (parts.length === 2) return TRAINER_SECTIONS.has(parts[1]);
  if (parts.length === 3 && parts[1] === 'cases') return isNumericId(parts[2]);

  return false;
}

function isSingleIdDetail(base: string, pathname: string): boolean {
  if (!pathname.startsWith(`${base}/`)) return false;
  const id = pathname.slice(base.length + 1).split('/')[0];
  return Boolean(id) && isNumericId(id);
}

function isDetailSeoPath(path: string): boolean {
  if (path.startsWith(`${ROUTES.PUBLIC_COURSES}/TK-`)) return true;
  if (path.startsWith('/opencourses/plan/')) return true;
  if (isSingleIdDetail(ROUTES.PUBLIC_COURSES, path)) return true;
  if (isSingleIdDetail(ROUTES.INTERNAL_COURSES, path)) return true;
  if (isSingleIdDetail(ROUTES.INSTITUTIONS, path)) return true;
  if (isSingleIdDetail(ROUTES.ASSOCIATIONS, path)) return true;
  if (isSingleIdDetail('/case', path)) return true;

  if (path.startsWith('/video/') || path.startsWith('/vedio/')) {
    const rest = path.slice(path.indexOf('/', 1) + 1);
    if (/^\d+$/.test(rest)) return true;
    if (/^\d+\/play$/.test(rest)) return true;
  }

  return isTrainerDetailPath(path);
}

/** 是否为公共站点「点击进入」的详情页（pathname 为 next-intl 路径，无 locale 前缀） */
export function isDetailPagePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);

  if (normalized === '/innercourses/supplier' || normalized === '/opencourses/supplier') {
    return false;
  }

  if (isDetailSeoPath(normalized)) return true;

  const seoPath = toSeoPath(normalized);
  if (seoPath !== normalized && isDetailSeoPath(seoPath)) return true;

  return false;
}
