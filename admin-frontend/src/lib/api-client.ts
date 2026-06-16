const API_PREFIX = '/api'

function baseUrl(): string {
  if (typeof window !== 'undefined') return '' // 浏览器端用相对路径
  // 服务端 fetch 必须用绝对 URL；SSR 时用 localhost 自调 BFF
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT || 3001}`
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${API_PREFIX}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(
        408,
        '请求超时，请确认后端 (localhost:8080) 已启动并完成编译'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    // 尝试刷新 token
    const refreshRes = await fetch(`${baseUrl()}${API_PREFIX}/auth/refresh`, { method: 'POST' });
    if (refreshRes.ok) {
      // 重试原请求
      const retryRes = await fetch(`${baseUrl()}${API_PREFIX}${endpoint}`, {
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
    throw new ApiError(
      res.status,
      body.message || `API error: ${res.status}`,
      body.code != null ? String(body.code) : undefined
    );
  }

  return res.json() as Promise<T>;
}

/** 校验 BFF/后端统一响应体，code !== 0 时抛出 ApiError */
export function assertApiOk<T>(body: { code: number; message: string; data: T }): T {
  if (body.code !== 0) {
    throw new ApiError(500, body.message || '请求失败', String(body.code));
  }
  return body.data;
}
