/**
 * 静态资源 URL 拼装工具
 *
 * 后端返回的图片/文件路径可能是三种形态，统一兜底：
 *   1. 完整 URL  -> 'https://x.com/a.jpg'  原样返回
 *   2. 站内绝对  -> '/static/a.jpg'        前缀 cdnBaseURL（无则 baseURL）
 *   3. 相对路径  -> 'static/a.jpg'         同上
 *
 * 没单独部署 CDN 时把 configs/env.js 的 CDN_BASE_URL 留空即可，
 * 资源会自动走后端 baseURL，业务代码无需关心是否上 CDN。
 */

import config from '@/configs';

export function toAssetUrl(path) {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (/^(https?:)?\/\//i.test(path)) return path;
  if (/^data:/i.test(path)) return path;

  const prefix = (config.cdnBaseURL || config.baseURL || '').replace(/\/+$/, '');
  if (!prefix) return path;
  return prefix + (path.startsWith('/') ? path : '/' + path);
}

export default toAssetUrl;
