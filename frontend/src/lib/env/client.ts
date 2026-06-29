// 客户端环境变量（NEXT_PUBLIC_* 前缀）

/** 与 {@link @/lib/http/client} 保持一致：未配置时本地开发默认连 8080 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
}

export function getCdnBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn5-pxb-videos.taoke.com'
  );
}
