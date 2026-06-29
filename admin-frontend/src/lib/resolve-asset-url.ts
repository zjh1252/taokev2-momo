/**
 * 后台静态资源 URL 解析工具。
 *
 * <p>上传文件由后端 {@code StorageService} 写入（local 或 aliyun-oss），
 * 返回 URL 可能是相对路径（{@code /uploads/...}）或 OSS/CDN 绝对地址。</p>
 *
 * <p>老站迁移数据常见 {@code /attachments/}、{@code /u/} 等路径，需指向旧站域名。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 23:30
 */

/** C 端前台站点 BaseURL — statics 等静态资源反代目标 */
const FRONTEND_BASE_URL = (
  process.env.NEXT_PUBLIC_FRONTEND_BASE_URL ??
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
).replace(/\/+$/, '');

/** OSS/CDN 域名前缀（可选；仅用于显式配置的非 uploads 资源） */
const CDN_BASE_URL = (process.env.NEXT_PUBLIC_CDN_BASE_URL ?? '').replace(/\/+$/, '');

/** PXB 录播 CDN（taoke/upload 路径，与本地上传 /uploads 无关） */
const PXB_CDN_BASE = (
  process.env.NEXT_PUBLIC_PXB_VIDEO_CDN_URL ?? 'https://cdn5-pxb-videos.taoke.com'
).replace(/\/+$/, '');

/** PXB 录播/上传 CDN — Referer=localhost 会被 ACL 拒绝（403） */
const PXB_CDN_HOSTS = ['cdn5-pxb-videos.taoke.com', 'cdn-pxb-videos.taoke.com'];
export const PXB_ASSET_PROXY_PREFIX = '/pxb-videos';

function isPxbCdnHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return PXB_CDN_HOSTS.includes(lower) || lower.endsWith('.pxb-videos.taoke.com');
}

function shouldUsePxbAssetProxy(): boolean {
  return process.env.NODE_ENV === 'development';
}

/** 外链图片须 no-referrer，否则 PXB CDN / 旧站可能 403 */
export function imageReferrerPolicy(
  url: string | null | undefined
): 'no-referrer' | undefined {
  if (!url?.trim()) return undefined;
  return /^(https?:)/i.test(url.trim()) ? 'no-referrer' : undefined;
}

function applyPxbDevProxy(absoluteUrl: string): string {
  if (!shouldUsePxbAssetProxy()) return absoluteUrl;
  try {
    const parsed = new URL(absoluteUrl);
    if (isPxbCdnHost(parsed.hostname)) {
      return `${PXB_ASSET_PROXY_PREFIX}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* keep original */
  }
  return absoluteUrl;
}

function joinBase(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\.\//, '').replace(/^\//, '')}`;
}

/** 老站 attachments / u 路径 → 同源反代或绝对 URL */
function resolveLegacyAssetPath(path: string): string | null {
  const normalized = path.startsWith('/') ? path : `/${path.replace(/^\//, '')}`;
  const isLegacy =
    normalized.startsWith('/attachments/')
    || normalized.startsWith('/u/')
    || path.startsWith('attachments/')
    || path.startsWith('u/');
  if (!isLegacy) return null;

  return `/taoke-legacy${normalized}`;
}

/**
 * 把后端返回的资源 URL 解析为可在浏览器中直接访问的地址。
 * uploads/statics 优先走后台同源相对路径（由 next.config rewrites 反代）。
 */
export function resolveAssetUrl(
  url: string | null | undefined,
): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (
        /^(www\.)?taoke\.com$/i.test(parsed.hostname)
        && (parsed.pathname.startsWith('/attachments/') || parsed.pathname.startsWith('/u/'))
      ) {
        return `/taoke-legacy${parsed.pathname}`;
      }
      if (
        /^localhost|127\.0\.0\.1$/i.test(parsed.hostname)
        && parsed.pathname.startsWith('/uploads/')
      ) {
        return parsed.pathname;
      }
      // 历史错误：CDN 域名 + /uploads 路径（OSS 实际在 /taoke/upload）
      if (
        /cdn5-pxb-videos\.taoke\.com$/i.test(parsed.hostname)
        && parsed.pathname.startsWith('/uploads/')
      ) {
        return parsed.pathname;
      }
    } catch {
      /* 保持原样 */
    }
    return applyPxbDevProxy(trimmed);
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  const legacy = resolveLegacyAssetPath(path.startsWith('/') ? path : trimmed);
  if (legacy) return legacy;

  if (path.startsWith('/uploads/')) {
    // 本地上传目录：走后台同源 /uploads rewrite → 后端 StorageService
    return path;
  }

  if (path.startsWith('/taoke/upload/') || trimmed.startsWith('taoke/upload/')) {
    return applyPxbDevProxy(
      joinBase(PXB_CDN_BASE, path.startsWith('/') ? path : `/${trimmed}`)
    );
  }

  if (path.startsWith('/statics/')) {
    return path;
  }

  if (CDN_BASE_URL) {
    return joinBase(CDN_BASE_URL, path);
  }

  if (FRONTEND_BASE_URL) {
    return `${FRONTEND_BASE_URL}${path}`;
  }

  return path;
}

/** 旧站/本地默认占位图，非真实头像（与后端 LegacyAvatarUrls 对齐） */
export function isPlaceholderLegacyAvatar(url: string | null | undefined): boolean {
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

/** 是否像可展示的图片资源 URL（过滤纯数字等脏数据） */
export function isLikelyImageAssetUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return (
      /\/uploads\//i.test(trimmed)
      || /\/taoke\/upload\//i.test(trimmed)
      || /\/statics\//i.test(trimmed)
      || /\/attachments\//i.test(trimmed)
      || /\/u\//i.test(trimmed)
      || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(trimmed)
    );
  }
  return (
    trimmed.startsWith('/uploads/')
    || trimmed.startsWith('uploads/')
    || trimmed.startsWith('/taoke/upload/')
    || trimmed.startsWith('taoke/upload/')
    || trimmed.startsWith('/statics/')
    || trimmed.startsWith('statics/')
    || trimmed.startsWith('/u/')
    || trimmed.startsWith('u/')
    || /\/attachments\//i.test(trimmed)
    || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(trimmed)
  );
}
