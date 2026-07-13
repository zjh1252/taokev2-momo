import { ROUTES } from '@/config/routes';

const TRAINER_SECTIONS = new Set(['courses', 'cases', 'video', 'comment', 'book']);

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment);
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

/** 是否为公共站点「点击进入」的详情页（pathname 为 next-intl SEO 路径，无 locale 前缀） */
export function isDetailPagePath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';

  if (path.startsWith(`${ROUTES.PUBLIC_COURSES}/TK-`)) return true;
  if (isSingleIdDetail(ROUTES.PUBLIC_COURSES, path)) return true;
  if (isSingleIdDetail(ROUTES.INTERNAL_COURSES, path)) return true;
  if (isSingleIdDetail(ROUTES.INSTITUTIONS, path)) return true;
  if (isSingleIdDetail(ROUTES.ASSOCIATIONS, path)) return true;
  if (isSingleIdDetail('/case', path)) return true;

  // SEO 路径为 /video（ROUTES.ONLINE_COURSES 为 /videos，与浏览器 pathname 不一致）
  if (path.startsWith('/video/')) {
    const rest = path.slice('/video/'.length);
    if (/^\d+$/.test(rest)) return true;
    if (/^\d+\/play$/.test(rest)) return true;
  }

  return isTrainerDetailPath(path);
}
