/**
 * 静态资源 URL 拼装工具
 *
 * 职责：把"后端返回的图片/文件路径"统一拼成绝对 URL，再交给 <image src="..."> 渲染。
 *
 * 输入分三类，行为如下：
 *   1. 完整 URL    -> 'https://x.com/a.jpg'   原样返回
 *   2. 协议相对    -> '//x.com/a.jpg'         原样返回
 *   3. data URI    -> 'data:image/png...'     原样返回
 *   4. 站内绝对/相对 -> '/uploads/x.png' / 'uploads/x.png'  → assetBaseURL + 路径
 *
 * 没配 ASSET_BASE_URL 不静默兜底（早期版本会回退到 baseURL，会让 API 域名和资源域名耦合）；
 * 缺失时 console.warn 一次并原样返回，便于排查。
 */

import config from '@/configs';

let warned = false;

export function toAssetUrl(path) {
  if (!path || typeof path !== 'string') return '';
  // 完整 URL / 协议相对 / data URI / 本地临时路径（uni.chooseImage 临时路径）一律放过
  if (/^(https?:|blob:|file:|wxfile:|data:|\/\/)/i.test(path)) return path;

  const prefix = (config.assetBaseURL || '').replace(/\/+$/, '');
  if (!prefix) {
    if (!warned) {
      console.warn('[toAssetUrl] config.assetBaseURL 未配置，资源 URL 不会被拼前缀，请检查 configs/env.js 的 ASSET_BASE_URL');
      warned = true;
    }
    return path;
  }
  return prefix + (path.startsWith('/') ? path : '/' + path);
}

export default toAssetUrl;
