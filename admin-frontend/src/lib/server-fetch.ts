import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * 服务端 fetch 封装，自动携带 accessToken 并处理后端统一响应格式
 * 仅用于 Route Handler / Server Component
 */
export async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ code: number; message: string; data: T }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>)
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers
  });

  const json = await res.json();
  return json;
}
