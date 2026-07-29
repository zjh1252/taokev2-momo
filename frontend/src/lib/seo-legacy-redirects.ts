/**
 * 老站 SEO URL → 新站 301 目标（纯函数，供 proxy 与单测共用）。
 *
 * @author Fangxinxin
 * @date 2026-07-29 15:35
 */

export const LEGACY_TRAINER_FILTER_FALLBACK = '/trainer';

const TRAINER_SECTIONS = new Set(['courses', 'cases', 'video', 'comment', 'book']);

function isDigits(segment: string): boolean {
  return /^\d+$/.test(segment);
}

/**
 * 老站数字筛选路径，如 `/trainer/501/0/0/.../1.htm`。
 * 排除详情 `/trainer/123.htm` 与 Tab `/trainer/123/courses.htm`。
 */
export function isLegacyNumericTrainerFilterPath(pathname: string): boolean {
  if (!pathname.startsWith('/trainer/') || !pathname.endsWith('.htm')) {
    return false;
  }
  const body = pathname.slice('/trainer/'.length, -'.htm'.length);
  if (!body) return false;

  const parts = body.split('/').filter(Boolean);
  if (parts.length < 2) return false;
  if (!isDigits(parts[0])) return false;

  // /trainer/{id}/{section}.htm
  if (parts.length === 2 && TRAINER_SECTIONS.has(parts[1])) {
    return false;
  }

  // 其余：数字段与可选 def（老站筛选位）
  return parts.every((p) => isDigits(p) || p === 'def');
}

/** `/videos` | `/vedio` 频道页 → `/video`（保留 query，含 leading `?`） */
export function legacyVideoChannelRedirectTarget(
  pathname: string,
  search: string,
): string | null {
  if (pathname !== '/videos' && pathname !== '/vedio') {
    return null;
  }
  const q = search.startsWith('?') ? search : search ? `?${search}` : '';
  return `/video${q}`;
}

/** `/vedio/{id}(.htm)` / play → `/video/...` */
export function legacyVedioDetailRedirectTarget(pathname: string): string | null {
  const playMatch = pathname.match(/^\/vedio\/(\d+)\/play$/);
  if (playMatch) {
    return `/video/${playMatch[1]}/play`;
  }
  const detailMatch = pathname.match(/^\/vedio\/(\d+)(?:\.htm)?$/);
  if (detailMatch) {
    return `/video/${detailMatch[1]}.htm`;
  }
  return null;
}

/** 老站 `/video_play/{id}.htm` → `/video/{id}/play` */
export function legacyVideoPlayRedirectTarget(pathname: string): string | null {
  const match = pathname.match(/^\/video_play\/(\d+)(?:\.htm)?$/);
  if (!match) return null;
  return `/video/${match[1]}/play`;
}
