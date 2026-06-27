/**
 * 服务端直连 Java 后端的根地址。
 * Windows 开发环境优先 127.0.0.1，避免 localhost 解析到 IPv6 ::1 导致 ECONNREFUSED。
 */
export function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL?.trim()
    || process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
    || 'http://127.0.0.1:8080';
  return normalizeBackendUrl(raw);
}

export function normalizeBackendUrl(url: string): string {
  return url
    .replace(/\/$/, '')
    .replace('://localhost:', '://127.0.0.1:')
    .replace('://localhost/', '://127.0.0.1/');
}
