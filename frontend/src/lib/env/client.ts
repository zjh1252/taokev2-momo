// 客户端环境变量（NEXT_PUBLIC_* 前缀）

/** 规范化 API 根地址：去掉尾斜杠，Windows 下 localhost → 127.0.0.1 避免 IPv6 连接失败 */
export function normalizeApiBaseUrl(url: string): string {
  return url
    .replace(/\/$/, '')
    .replace('://localhost:', '://127.0.0.1:')
    .replace('://localhost/', '://127.0.0.1/');
}

/** 与 {@link @/lib/http/client} 保持一致：本地开发默认 127.0.0.1:8080 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8080';
  return normalizeApiBaseUrl(raw);
}

export function getCdnBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn5-pxb-videos.taoke.com'
  );
}

/** 老站静态 CDN（attachments/、statics/images/trainers/ 等） */
export function getLegacyStaticCdnBase(): string {
  return (
    process.env.NEXT_PUBLIC_LEGACY_STATIC_CDN_BASE ||
    'https://cdn-static.taoke.com/taoke/'
  );
}

/** 老站主站根（u/ 路径）；未配置时回退 LEGACY_ASSET_BASE_URL */
export function getLegacyMainSiteBase(): string {
  const main =
    process.env.NEXT_PUBLIC_LEGACY_MAIN_SITE_BASE ||
    process.env.NEXT_PUBLIC_LEGACY_ASSET_BASE_URL ||
    'https://www.taoke.com/';
  return main.endsWith('/') ? main : `${main}/`;
}
