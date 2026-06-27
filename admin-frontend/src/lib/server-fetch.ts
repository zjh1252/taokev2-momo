import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/backend-url';

/**
 * 是否使用 Secure Cookie（仅 HTTPS 环境设为 true）。
 * 通过环境变量 COOKIE_SECURE 控制，默认 false。
 */
export const USE_SECURE_COOKIE = process.env.COOKIE_SECURE === 'true';

/** 统一响应体结构 */
export interface ApiResponseBody<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 服务端 fetch 封装，自动携带 accessToken 并解析后端统一响应。
 * <p>仅用于 Route Handler / Server Component。当后端返回非 2xx 时仍返回业务体，
 * 由调用方判断；若需要把后端 HTTP status 透传给浏览器，请改用
 * {@link serverFetchWithStatus}。</p>
 */
export async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponseBody<T>> {
  const { body } = await serverFetchWithStatus<T>(endpoint, options);
  return body;
}

/**
 * 带 HTTP status 的服务端 fetch。
 * <p>BFF Route Handler 用这个版本可以把后端的 4xx/5xx 透传给浏览器，
 * 避免错误被 {@code NextResponse.json(body)} 包成默认 200，
 * 导致前端 mutation 进不了 onError、toast 看不到具体错误。</p>
 */
export async function serverFetchWithStatus<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ status: number; body: ApiResponseBody<T> }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>)
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30 秒超时

  let res: Response;
  const backendUrl = getBackendUrl();
  try {
    res = await fetch(`${backendUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        status: 504,
        body: {
          code: -1,
          message: `后端请求超时（>${backendUrl}），请确认 Java 服务已启动并完成编译`,
          data: undefined as unknown as T
        }
      };
    }
    const hint =
      err instanceof Error && 'cause' in err && err.cause instanceof Error
        ? err.cause.message
        : err instanceof Error
          ? err.message
          : '网络错误';
    return {
      status: 502,
      body: {
        code: -1,
        message: `无法连接后端 ${backendUrl}（${hint}）`,
        data: undefined as unknown as T
      }
    };
  } finally {
    clearTimeout(timeoutId);
  }

  // 业务异常也带 JSON body，统一用 .json()；解析失败时降级为通用错误体
  let body: ApiResponseBody<T>;
  try {
    body = (await res.json()) as ApiResponseBody<T>;
  } catch {
    body = {
      code: res.status === 404 ? 90002 : -1,
      message: `后端响应解析失败（HTTP ${res.status}）`,
      data: undefined as unknown as T,
    };
  }
  return { status: res.status, body };
}
