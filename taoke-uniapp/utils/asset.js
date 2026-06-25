/**
 * 静态资源 URL 拼装工具
 *
 * 职责：把"后端返回的图片/文件路径"统一拼成绝对 URL，再交给 <image src="..."> 渲染。
 */

import config from '@/configs';

let warned = false;
let warnedHttp = false;

function assetPrefix() {
  return (config.assetBaseURL || '').replace(/\/+$/, '');
}

/** 小程序不支持 HTTP 网络图，将 http 升级为 https，并将 localhost 换为资源 CDN */
function normalizeForNative(url) {
  if (!url || typeof url !== 'string') return url;

  const prefix = assetPrefix();

  // localhost / 局域网 dev 地址 → 测试 CDN
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?/i.test(url)) {
    try {
      const path = url.replace(/^https?:\/\/[^/]+/i, '');
      if (prefix) return prefix + (path.startsWith('/') ? path : `/${path}`);
    } catch (_) { /* ignore */ }
  }

  // 微信 image 组件禁止 HTTP
  if (/^http:\/\//i.test(url)) {
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
  if (/^(https?:|blob:|file:|wxfile:|data:|\/\/)/i.test(path)) {
    // #ifdef MP-WEIXIN || APP-PLUS
    return normalizeForNative(path);
    // #endif
    // #ifdef H5
    return path;
    // #endif
  }

  const prefix = assetPrefix();
  if (!prefix) {
    if (!warned) {
      console.warn('[toAssetUrl] config.assetBaseURL 未配置，资源 URL 不会被拼前缀');
      warned = true;
    }
    return path;
  }

  let url = prefix + (path.startsWith('/') ? path : `/${path}`);

  // #ifdef MP-WEIXIN || APP-PLUS
  url = normalizeForNative(url);
  // #endif

  return url;
}

export default toAssetUrl;
