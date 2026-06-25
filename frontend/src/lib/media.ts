import { getApiBaseUrl, getCdnBaseUrl } from '@/lib/env/client';

/** 图片加载失败或无 URL 时的占位（由后台素材库解析，前端不再使用本地默认图） */
export const EMPTY_IMAGE_SRC = '';

/**
 * @deprecated 默认头像由后台素材库统一解析，请使用接口返回的 avatar/coverUrl
 */
export const DEFAULT_TRAINER_AVATAR = EMPTY_IMAGE_SRC;

/**
 * @deprecated 默认封面由后台素材库统一解析，请使用接口返回的 coverUrl
 */
export const DEFAULT_COURSE_COVER = EMPTY_IMAGE_SRC;

/** 旧站/本地默认占位图，非真实头像 */
export function isPlaceholderLegacyAvatar(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const normalized = url.trim().replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/middle/00/1.') || normalized.endsWith('/middle/00/1')) {
    return true;
  }
  return (
    normalized.includes('taoke-new-logo')
    || normalized.includes('expert-main')
    || normalized.includes('avatar-placeholder')
    || normalized.includes('nophoto')
    || normalized.includes('no_photo')
    || normalized.includes('no-photo')
    || normalized.includes('noavatar')
    || normalized.includes('no-avatar')
    || normalized.includes('default_avatar')
    || normalized.includes('default-avatar')
    || normalized.includes('zwzp')
  );
}

/** @deprecated 默认头像由后台素材库统一解析 */
export function getTrainerAvatarFallback(_displayName?: string): string {
  return EMPTY_IMAGE_SRC;
}

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
  fallback = EMPTY_IMAGE_SRC,
  skipPlaceholder = false,
): string {
  if (!src?.trim()) return fallback;
  if (!skipPlaceholder && isPlaceholderLegacyAvatar(src)) return fallback;

  const value = src.trim();

  if (value.startsWith('//')) {
    return normalizeHttpCoverUrl(`https:${value}`);
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      // 素材库可能存 C 端绝对地址，统一为同源 /uploads 走 rewrite
      if (
        /^localhost|127\.0\.0\.1$/i.test(parsed.hostname)
        && parsed.pathname.startsWith('/uploads/')
      ) {
        return parsed.pathname;
      }
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
    // 本地 dev 保持 /uploads 相对路径，走 next.config rewrite；避免 next/image 直连 :8080 触发 private IP 拦截
    if (isLocalDevApi()) return value;
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
  fallback = EMPTY_IMAGE_SRC,
): string {
  return resolveImageSrcRaw(src, fallback);
}

/** 接口已解析的展示图（含素材库默认），仅做路径规范化，不再二次剔除占位图 */
export function resolveApiImageSrc(
  src?: string | null,
  fallback = EMPTY_IMAGE_SRC,
): string {
  return resolveImageSrcRaw(src, fallback, true);
}

/** 机构 Logo 加载失败占位（本地静态资源，避免外链不可用） */
export function getInstitutionLogoFallback(_orgName?: string): string {
  return '/statics/images/taoke-new-logo.jpg';
}

/** 录播课封面加载失败占位（封面应由接口经素材库解析后返回） */
export function getVideoCoverFallback(_title?: string): string {
  return EMPTY_IMAGE_SRC;
}

/** 32 位 MD5 老库视频 key（无扩展名） */
const LEGACY_VIDEO_MD5_RE = /^[a-f0-9]{32}$/i;

/** 本地 dev 反代 PXB 录播 CDN（cdn 拒绝 Referer=localhost） */
export const PXB_VIDEO_PROXY_PREFIX = '/pxb-videos';

const PXB_CDN_HOSTS = new Set(['cdn5-pxb-videos.taoke.com', 'cdn-pxb-videos.taoke.com']);

function isPxbCdnHost(hostname: string): boolean {
  return PXB_CDN_HOSTS.has(hostname) || hostname.endsWith('.pxb-videos.taoke.com');
}

function isLocalDevOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/i.test(
    window.location.origin,
  );
}

/** 本地 dev：API/CDN 指向 localhost，上传走同源 rewrite */
function isLocalDevApi(): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  return /localhost|127\.0\.0\.1/i.test(base);
}

/** dev 环境且页面在本地 origin 上打开（含局域网 IP） */
function shouldUseLocalVideoProxy(): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  return isLocalDevOrigin() || isLocalDevApi();
}

/** 相对媒体路径 → 当前站点绝对 URL（Video.js 需完整地址） */
export function toAbsoluteMediaUrl(url: string): string {
  if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  if (typeof window === 'undefined') return url;
  return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
}

/** localhost 开发时将 PXB CDN 转为同源路径，配合 next.config rewrites */
function applyLocalDevVideoProxy(url: string): string {
  if (!shouldUseLocalVideoProxy()) {
    return url;
  }
  if (url.startsWith(PXB_VIDEO_PROXY_PREFIX)) {
    return toAbsoluteMediaUrl(url);
  }
  try {
    const parsed = new URL(url);
    if (isPxbCdnHost(parsed.hostname)) {
      return toAbsoluteMediaUrl(
        `${PXB_VIDEO_PROXY_PREFIX}${parsed.pathname}${parsed.search}`,
      );
    }
  } catch {
    /* 相对路径 */
  }
  return url;
}

/**
 * 将后端/老库录播课播放地址规范为 Video.js 可请求的 URL。
 * 对齐老站 videoPlayUrl()：videos/*、taoke/* → PXB CDN；纯 MD5 → old-videos。
 */
export function resolveVideoPlaybackSrc(src?: string | null): string | null {
  const value = src?.trim();
  if (!value) return null;

  if (/^(eceibs|kuaike):/i.test(value)) {
    return value;
  }

  if (value.includes('@@') || /^<embed/i.test(value)) {
    return null;
  }

  /** 非 embed 可解析的 SWF 在 resolveChapterPlayback 中已优先处理 */
  if (/\.swf(\?|$)/i.test(value) && !/(youku\.com|polyv\.net|56\.com|tudou\.com|qq\.com|ku6\.com)/i.test(value)) {
    return null;
  }

  /** 老库脏数据：仅文件名、无路径，拼 CDN 必 404 */
  if (
    !value.includes('://')
    && !value.startsWith('/')
    && !value.startsWith('taoke/')
    && !value.startsWith('videos/')
    && !value.startsWith('attachments/')
    && !LEGACY_VIDEO_MD5_RE.test(value)
    && !/^[0-9A-Fa-f]+-\d+$/.test(value)
  ) {
    return null;
  }

  let resolved: string;

  if (value.startsWith('//')) {
    resolved = normalizeHttpCoverUrl(`https:${value}`);
  } else if (value.startsWith('http://') || value.startsWith('https://')) {
    resolved = normalizeHttpCoverUrl(value);
  } else if (value.startsWith(PXB_VIDEO_PROXY_PREFIX)) {
    resolved = value;
  } else if (resolveLegacyVideoCoverPath(value)) {
    resolved = resolveLegacyVideoCoverPath(value)!;
  } else if (value.startsWith('taoke/') || value.startsWith('videos/')) {
    resolved = joinBase(PXB_VIDEO_CDN, value);
  } else if (LEGACY_VIDEO_MD5_RE.test(value)) {
    resolved = joinBase(PXB_VIDEO_CDN, `taoke/old-videos/videos/${value}.mp4`);
  } else if (value.startsWith('/attachments/') || value.startsWith('attachments/')) {
    const path = value.startsWith('/') ? value : `/${value}`;
    resolved = joinBase(LEGACY_ASSET_BASE, path);
  } else if (value.startsWith('/uploads/')) {
    if (isLocalDevApi()) {
      resolved = value;
    } else {
      try {
        const base = (getCdnBaseUrl() || getApiBaseUrl()).replace(/\/$/, '');
        resolved = `${base}${value}`;
      } catch {
        resolved = value;
      }
    }
  } else if (!value.includes('://')) {
    resolved = joinBase(PXB_VIDEO_CDN, value);
  } else {
    resolved = value;
  }

  return applyLocalDevVideoProxy(resolved);
}

/** 91pxb 历史域名：大量录播封面源站已下线或不可达 */
export function isUnreliableLegacyImageHost(url: string): boolean {
  return /:\/\/(?:www\.)?91pxb\.com\//i.test(url)
    || /:\/\/meethr\.91pxb\.com\//i.test(url);
}
