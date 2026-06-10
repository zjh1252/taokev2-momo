import { getApiBaseUrl, getCdnBaseUrl } from '@/lib/env/client';

export const DEFAULT_TRAINER_AVATAR = '/statics/images/expert-main.jpg';
export const DEFAULT_COURSE_COVER = '/statics/images/course-1.jpg';

/** 老站录播封面 onerror 占位（www.taoke.com/video/*.html 同源逻辑） */
export const DEFAULT_VIDEO_COVER =
  'https://cdn-static.taoke.com/taoke/images/default_video.jpg';

/** 旧站（v3 迁移库）静态资源域名，attachments/u/ 等路径在此可访问 */
const LEGACY_ASSET_BASE =
  process.env.NEXT_PUBLIC_LEGACY_ASSET_BASE_URL || 'https://www.taoke.com';

/** 旧录播 FSM 存储 key → preview 网关 */
const FSM_PREVIEW_BASE =
  process.env.NEXT_PUBLIC_FSM_PREVIEW_BASE_URL || 'https://preview.kuanxue.com';

/** 淘课 PXB 录播封面 CDN（taoke/covers/...） */
const PXB_VIDEO_CDN =
  process.env.NEXT_PUBLIC_PXB_VIDEO_CDN_URL || 'https://cdn5-pxb-videos.taoke.com';

/** 旧库 FSM 文件 key，如 B16BE5044D2F9DDE-0 */
const FSM_STORAGE_KEY_RE = /^[0-9A-Fa-f]+-\d+$/;

function joinBase(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\.\//, '').replace(/^\//, '')}`;
}

function normalizeHttpCoverUrl(value: string): string {
  let url = value.replace(/([^:]\/)\/+/g, '$1');
  if (url.startsWith('http://')) {
    try {
      const { hostname } = new URL(url);
      const httpsHosts = [
        'www.taoke.com',
        'taoke.com',
        'cdn-static.taoke.com',
        'cdn5-pxb-videos.taoke.com',
        'preview.kuanxue.com',
        'www.91pxb.com',
        'meethr.91pxb.com',
        'kuanxue-fsm.oss-cn-hangzhou.aliyuncs.com',
        'osscdn-training.ihr360.com',
        'ws1.witsharer.com',
      ];
      if (httpsHosts.includes(hostname)) {
        url = `https://${url.slice('http://'.length)}`;
      }
    } catch {
      /* 保持原样 */
    }
  }

  // 91pxb / meethr.91pxb.com：录播封面历史域名，文件不在 taoke.com，禁止走 /taoke-legacy 反代。
  if (url.startsWith('http://meethr.91pxb.com/')) {
    return url.replace('http://meethr.91pxb.com/', 'https://meethr.91pxb.com/');
  }
  if (url.startsWith('http://www.91pxb.com/')) {
    return url.replace('http://www.91pxb.com/', 'https://www.91pxb.com/');
  }

  // www.taoke.com / taoke.com：img 展示无 CORS 限制，直连旧站（SafeImage 已设 no-referrer）。
  // dev 下 /taoke-legacy 代理在列表页并发十几张 Logo 时易集体失败。
  if (url.startsWith('https://taoke.com/')) {
    return url.replace('https://taoke.com/', 'https://www.taoke.com/');
  }

  return url;
}

/** 旧录播封面特殊路径（FSM key、OSS 相对路径） */
function resolveLegacyVideoCoverPath(value: string): string | null {
  if (FSM_STORAGE_KEY_RE.test(value)) {
    return `${FSM_PREVIEW_BASE.replace(/\/$/, '')}/fsm/${value}`;
  }
  if (value.startsWith('taoke/covers/')) {
    return joinBase(PXB_VIDEO_CDN, value);
  }
  if (value.startsWith('taoke/upload/')) {
    return `${FSM_PREVIEW_BASE.replace(/\/$/, '')}/fsm/${value}`;
  }
  return null;
}

/** 旧库相对路径：无协议且不以 /statics、/uploads 开头 */
function isLegacyRelativePath(value: string): boolean {
  return (
    value.startsWith('attachments/') ||
    value.startsWith('u/') ||
    (!value.startsWith('/statics') &&
      !value.startsWith('/uploads') &&
      !value.includes('://'))
  );
}

/** 旧站静态资源同源代理前缀（见 next.config rewrites → www.taoke.com） */
export const LEGACY_ASSET_PROXY_PREFIX = '/taoke-legacy';

const LEGACY_PROXY_HOSTS = new Set(['www.taoke.com', 'taoke.com', 'cdn-static.taoke.com']);

function toLegacyProxyUrl(url: string): string {
  if (url.startsWith(LEGACY_ASSET_PROXY_PREFIX)) return url;

  if (url.startsWith('/attachments/') || url.startsWith('/u/')) {
    return `${LEGACY_ASSET_PROXY_PREFIX}${url}`;
  }

  if (url.startsWith('attachments/') || url.startsWith('u/')) {
    return `${LEGACY_ASSET_PROXY_PREFIX}/${url}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      if (LEGACY_PROXY_HOSTS.has(u.hostname)) {
        return `${LEGACY_ASSET_PROXY_PREFIX}${u.pathname}${u.search}`;
      }
    } catch {
      /* 保持原样 */
    }
  }

  return url;
}

function applyLegacyProxy(url: string, fallback: string): string {
  if (!url || url === fallback) return url;
  if (url.startsWith('/statics') || url.startsWith('/uploads')) return url;
  return toLegacyProxyUrl(url);
}

/**
 * 将后端/旧库返回的图片路径规范为 Next.js Image 可用的 src。
 */
function resolveImageSrcRaw(
  src?: string | null,
  fallback = DEFAULT_TRAINER_AVATAR,
): string {
  if (!src?.trim()) return fallback;

  const value = src.trim();

  if (value.startsWith('//')) {
    return normalizeHttpCoverUrl(`https:${value}`);
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      new URL(value);
      return normalizeHttpCoverUrl(value);
    } catch {
      return fallback;
    }
  }

  const legacyVideoCover = resolveLegacyVideoCoverPath(value);
  if (legacyVideoCover) return legacyVideoCover;

  // 历史数据可能已写成 /taoke-legacy/...，还原为对应源站绝对地址
  if (value.startsWith(LEGACY_ASSET_PROXY_PREFIX)) {
    const legacyPath = value.slice(LEGACY_ASSET_PROXY_PREFIX.length);
    if (legacyPath.startsWith('/data/attachment/')) {
      return joinBase('https://www.91pxb.com', legacyPath);
    }
    return joinBase(LEGACY_ASSET_BASE, legacyPath);
  }

  // 旧站绝对路径：/attachments/、/u/ 拼旧站域名直连
  if (value.startsWith('/attachments/') || value.startsWith('/u/')) {
    return joinBase(LEGACY_ASSET_BASE, value);
  }

  // v2 本地上传目录（storage.base-dir → frontend/public）
  if (value.startsWith('/uploads/')) {
    try {
      const base = (getCdnBaseUrl() || getApiBaseUrl()).replace(/\/$/, '');
      return `${base}${value}`;
    } catch {
      return value;
    }
  }

  // /statics 由 Next 本地 public 或 ingress 静态目录提供，保持相对路径
  if (value.startsWith('/')) return value;

  if (isLegacyRelativePath(value)) {
    return joinBase(LEGACY_ASSET_BASE, value);
  }

  try {
    const base = getCdnBaseUrl().replace(/\/$/, '');
    if (!base) return fallback;
    return joinBase(base, value);
  } catch {
    return fallback;
  }
}

export function resolveImageSrc(
  src?: string | null,
  fallback = DEFAULT_TRAINER_AVATAR,
): string {
  return resolveImageSrcRaw(src, fallback);
}

/** 机构 Logo 加载失败占位（本地静态资源，避免外链不可用） */
export function getInstitutionLogoFallback(_orgName?: string): string {
  return '/statics/images/taoke-new-logo.jpg';
}

/** 录播课封面加载失败占位（与老站 default_video.jpg 一致） */
export function getVideoCoverFallback(_title?: string): string {
  return DEFAULT_VIDEO_COVER;
}

/** 91pxb 历史域名：大量录播封面源站已下线或不可达 */
export function isUnreliableLegacyImageHost(url: string): boolean {
  return /:\/\/(?:www\.)?91pxb\.com\//i.test(url)
    || /:\/\/meethr\.91pxb\.com\//i.test(url);
}
