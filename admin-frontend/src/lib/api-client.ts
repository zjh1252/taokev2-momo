const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (res.status === 401) {
    // 尝试刷新 token
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST' });
    if (refreshRes.ok) {
      // 重试原请求
      const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (retryRes.ok) {
        return retryRes.json() as Promise<T>;
      }
    }
    // 刷新失败，跳转登录
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, '登录已过期，请重新登录');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
