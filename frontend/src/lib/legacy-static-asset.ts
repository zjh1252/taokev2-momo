import { getLegacyMainSiteBase, getLegacyStaticCdnBase } from '@/lib/env/client';

const LEGACY_CDN_HOSTS = new Set(['cdn-static.taoke.com', 'cdn.test.taoke.com']);
const LEGACY_MAIN_HOSTS = new Set(['www.taoke.com', 'taoke.com']);

function withTrailingSlash(base: string): string {
  if (!base?.trim()) return '';
  return base.endsWith('/') ? base : `${base}/`;
}

/** 是否应走 Legacy CDN（attachments、u/、迁移讲师 statics） */
export function isLegacyStaticRelativePath(path: string): boolean {
  const v = path.startsWith('/') ? path.slice(1) : path;
  return (
    v.startsWith('attachments/') ||
    v.startsWith('u/') ||
    v.startsWith('statics/images/trainers/')
  );
}

/** 从老站 CDN / 主站绝对 URL 提取相对路径（对齐后端 LegacyStaticAssetUrls） */
export function extractLegacyRelativePath(absoluteUrl: string): string | null {
  try {
    const u = new URL(absoluteUrl.trim());
    const hostLower = u.hostname.toLowerCase();
    let normalizedPath = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
    if (!normalizedPath) return null;

    if (LEGACY_CDN_HOSTS.has(hostLower)) {
      if (normalizedPath.startsWith('taoke/')) {
        normalizedPath = normalizedPath.slice('taoke/'.length);
      }
      return normalizedPath;
    }

    if (LEGACY_MAIN_HOSTS.has(hostLower)) {
      if (
        normalizedPath.startsWith('u/') ||
        normalizedPath.startsWith('attachments/') ||
        normalizedPath.startsWith('statics/')
      ) {
        return normalizedPath;
      }
    }
  } catch {
    /* 非合法 URL */
  }
  return null;
}

/**
 * 将库中相对路径或已知老站绝对 URL 转为配置的 CDN / 主站完整地址。
 */
export function resolveLegacyStaticAssetUrl(path: string | null | undefined): string {
  if (!path?.trim()) return '';

  let value = path.trim().replace(/\\/g, '/');
  const cdnBase = getLegacyStaticCdnBase();
  const mainSiteBase = getLegacyMainSiteBase();

  if (value.startsWith('http://') || value.startsWith('https://')) {
    const relative = extractLegacyRelativePath(value);
    if (relative) {
      return resolveLegacyStaticAssetUrl(relative);
    }
    return value;
  }

  if (value.startsWith('/')) {
    value = value.slice(1);
  }

  if (value.startsWith('u/')) {
    return withTrailingSlash(mainSiteBase) + value;
  }
  return withTrailingSlash(cdnBase) + value;
}

/**
 * 若 path 属于 Legacy 静态资源，返回 CDN/主站 URL；否则返回 null（走原有 resolve 逻辑）。
 */
export function tryResolveLegacyStaticAssetUrl(value: string): string | null {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    const relative = extractLegacyRelativePath(value);
    if (!relative || !isLegacyStaticRelativePath(relative)) {
      return null;
    }
    return resolveLegacyStaticAssetUrl(relative);
  }

  if (isLegacyStaticRelativePath(value)) {
    return resolveLegacyStaticAssetUrl(value);
  }

  return null;
}
