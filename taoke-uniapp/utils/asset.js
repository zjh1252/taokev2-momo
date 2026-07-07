/**
 * 静态资源 URL 拼装工具
 *
 * 对齐 C 端 frontend/src/lib/media.ts 与后端 LegacyAvatarUrls：
 * - taoke/upload/* → PXB OSS CDN（上传默认 aliyun-oss）
 * - /statics/ → config.assetBaseURL（前端静态资源）
 * - /attachments/、/u/ → 旧站 www.taoke.com
 * - taoke/covers/ → PXB 录播 CDN
 */

import config, { IS_DEV } from '@/configs';

let warned = false;
let warnedHttp = false;

const LAN_HOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?/i;

const LEGACY_ASSET_BASE = (
  import.meta.env.VITE_LEGACY_ASSET_BASE_URL || 'https://www.taoke.com'
).replace(/\/+$/, '');

const PXB_VIDEO_CDN = (
  import.meta.env.VITE_PXB_VIDEO_CDN_URL || 'https://cdn5-pxb-videos.taoke.com'
).replace(/\/+$/, '');

const FSM_PREVIEW_BASE = (
  import.meta.env.VITE_FSM_PREVIEW_BASE_URL || 'https://preview.kuanxue.com'
).replace(/\/+$/, '');

const FSM_STORAGE_KEY_RE = /^[0-9A-Fa-f]+-\d+$/;

const PXB_CDN_HOSTS = new Set([
  'cdn5-pxb-videos.taoke.com',
  'cdn-pxb-videos.taoke.com',
]);

const HTTPS_HOSTS = new Set([
  'www.taoke.com',
  'taoke.com',
  'cdn-static.taoke.com',
  'cdn5-pxb-videos.taoke.com',
  'cdn-pxb-videos.taoke.com',
  'preview.kuanxue.com',
  'www.91pxb.com',
  'meethr.91pxb.com',
]);

function assetPrefix() {
  return (config.assetBaseURL || '').replace(/\/+$/, '');
}

function isPxbUploadPath(value) {
  return value.startsWith('/taoke/upload/') || value.startsWith('taoke/upload/');
}

function resolvePxbUploadPath(value) {
  const path = value.startsWith('/') ? value : `/${value}`;
  return joinBase(PXB_VIDEO_CDN, path);
}

/** 旧站/本地默认占位图，非真实头像 */
export function isPlaceholderLegacyAvatar(url) {
  if (!url || typeof url !== 'string') return false;
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

function joinBase(base, path) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\.\//, '').replace(/^\//, '')}`;
}

/** development + 资源前缀为本机/局域网：真机调试走 HTTP，不转到 v2 自签 CDN */
function isDevLanAssetMode() {
  return IS_DEV && LAN_HOST_RE.test(assetPrefix());
}

function isPxbCdnHost(hostname) {
  const lower = hostname.toLowerCase();
  return PXB_CDN_HOSTS.has(lower) || lower.endsWith('.pxb-videos.taoke.com');
}

function normalizeHttpUrl(url) {
  if (!url || !/^http:\/\//i.test(url)) return url;
  try {
    const { hostname } = new URL(url);
    if (HTTPS_HOSTS.has(hostname) || isPxbCdnHost(hostname)) {
      return url.replace(/^http:\/\//i, 'https://');
    }
  } catch (_) { /* ignore */ }
  return url;
}

function resolveLegacyVideoCoverPath(value) {
  if (FSM_STORAGE_KEY_RE.test(value)) {
    return `${FSM_PREVIEW_BASE}/fsm/${value}`;
  }
  if (value.startsWith('taoke/covers/')) {
    return joinBase(PXB_VIDEO_CDN, value);
  }
  return null;
}

function isLegacyRelativePath(value) {
  return (
    value.startsWith('attachments/')
    || value.startsWith('u/')
    || (!value.startsWith('/statics') && !value.startsWith('/uploads') && !value.includes('://'))
  );
}

/** 将后端/旧库路径解析为绝对 URL（尚未做小程序 native 适配） */
function resolveAssetPath(path) {
  const value = path.trim();

  if (value.startsWith('//')) {
    return normalizeHttpUrl(`https:${value}`);
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (isPxbUploadPath(parsed.pathname)) {
        return resolvePxbUploadPath(parsed.pathname);
      }
      if (parsed.pathname.startsWith('/uploads/taoke/upload/')) {
        return resolvePxbUploadPath(parsed.pathname.slice('/uploads'.length));
      }
      if (
        /^localhost|127\.0\.0\.1$/i.test(parsed.hostname)
        && parsed.pathname.startsWith('/uploads/')
      ) {
        const prefix = assetPrefix();
        return prefix ? prefix + parsed.pathname : parsed.pathname;
      }
      if (parsed.hostname === 'taoke.com') {
        return normalizeHttpUrl(value.replace('https://taoke.com/', 'https://www.taoke.com/'));
      }
    } catch (_) { /* ignore */ }
    return normalizeHttpUrl(value);
  }

  if (isPxbUploadPath(value)) {
    return resolvePxbUploadPath(value);
  }

  if (value.startsWith('/uploads/taoke/upload/')) {
    return resolvePxbUploadPath(value.slice('/uploads'.length));
  }

  const legacyVideoCover = resolveLegacyVideoCoverPath(value);
  if (legacyVideoCover) return legacyVideoCover;

  if (value.startsWith('/attachments/') || value.startsWith('/u/')) {
    return joinBase(LEGACY_ASSET_BASE, value);
  }

  if (value.startsWith('attachments/') || value.startsWith('u/')) {
    return joinBase(LEGACY_ASSET_BASE, value);
  }

  if (value.startsWith('/statics/')) {
    const prefix = assetPrefix();
    return prefix ? prefix + value : value;
  }

  if (value.startsWith('/uploads/')) {
    const prefix = assetPrefix();
    return prefix ? prefix + value : value;
  }

  if (value.startsWith('taoke/')) {
    return joinBase(PXB_VIDEO_CDN, value);
  }

  if (value.startsWith('/')) {
    const prefix = assetPrefix();
    return prefix ? prefix + value : value;
  }

  if (isLegacyRelativePath(value)) {
    return joinBase(LEGACY_ASSET_BASE, value);
  }

  const prefix = assetPrefix();
  if (!prefix) return value;
  return joinBase(prefix, value);
}

/** 小程序不支持 HTTP 网络图，将 http 升级为 https，并将 localhost 换为资源 CDN */
function normalizeForNative(url) {
  if (!url || typeof url !== 'string') return url;

  const prefix = assetPrefix();
  const devLanMode = isDevLanAssetMode();

  if (!devLanMode && LAN_HOST_RE.test(url)) {
    try {
      const path = url.replace(/^https?:\/\/[^/]+/i, '');
      if (prefix) return prefix + (path.startsWith('/') ? path : `/${path}`);
    } catch (_) { /* ignore */ }
  }

  if (/^http:\/\//i.test(url)) {
    if (devLanMode && LAN_HOST_RE.test(url)) {
      return url;
    }
    if (!warnedHttp) {
      console.warn('[toAssetUrl] 小程序不支持 HTTP 图片，已尝试升级为 HTTPS');
      warnedHttp = true;
    }
    return url.replace(/^http:\/\//i, 'https://');
  }

  return url;
}

export function toAssetUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (isPlaceholderLegacyAvatar(path)) return '';

  let url = resolveAssetPath(path);

  // #ifdef MP-WEIXIN || APP-PLUS
  url = normalizeForNative(url);
  // #endif

  if (!url && !warned) {
    warned = true;
  }

  return url;
}

export default toAssetUrl;
