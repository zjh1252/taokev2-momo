import { getApiBaseUrl, getCdnBaseUrl } from '@/lib/env/client';

export const DEFAULT_TRAINER_AVATAR = '/statics/images/expert-main.jpg';
export const DEFAULT_COURSE_COVER = '/statics/images/course-1.jpg';

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

/**
 * 将后端/旧库返回的图片路径规范为 Next.js Image 可用的 src。
 */
export function resolveImageSrc(
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

  // 旧站绝对路径：/attachments/、/u/ 在 LEGACY_ASSET_BASE 可访问，非本地 public
  if (value.startsWith('/attachments/') || value.startsWith('/u/')) {
    return `${LEGACY_ASSET_BASE.replace(/\/$/, '')}${value}`;
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
