const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/** 分类树、批量计数等低频变更数据：SSR 短缓存，减轻重复导航压力 */
const READ_CACHE = { next: { revalidate: 300 } } as const;

/**
 * 服务端只读 GET（带 revalidate，不弹 toast）
 */
export async function serverApiGet<T>(endpoint: string): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...READ_CACHE,
  });

  if (!response.ok) {
    throw new Error(`Server API ${response.status}: ${endpoint}`);
  }

  return response.json() as Promise<T>;
}
