import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { getApiBaseUrl } from '@/lib/env/client';

/** 从 localStorage 读取 accessToken，供请求自动附带 Authorization */
function getStoredAccessToken(): string | null {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return tokenData?.accessToken ?? null;
}

/**
 * API 异常类，携带 HTTP 状态码和业务错误码
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
export class ApiException extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string,
  ) {
    super(message || `API 请求失败: ${status}`);
    this.name = 'ApiException';
  }
}

/** 扩展选项：silent 为 true 时不弹 toast；skipAuth 为 true 时不附带 Authorization */
export interface ApiRequestOptions extends RequestInit {
  silent?: boolean;
  skipAuth?: boolean;
}

/**
 * 将后端/第三方英文错误文案转为用户可读中文
 */
function normalizeErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('access token') || lower.includes('access_token')) {
    return '登录状态已失效，请重新登录';
  }
  if (lower.includes('sms') && lower.includes('fail')) {
    return '短信发送失败，请稍后重试';
  }
  return message;
}

const STATUS_MESSAGE_MAP: Record<number, string> = {
  401: '登录已过期，请重新登录',
  403: '没有权限执行此操作',
  404: '请求的资源不存在',
  500: '服务器内部错误',
};

/**
 * 从后端响应体中提取错误消息
 * <p>后端统一格式：{ code, message, data }</p>
 */
async function extractError(response: Response, status: number): Promise<{ code?: string; message: string }> {
  try {
    const body = await response.json();
    return {
      code: body?.code != null ? String(body.code) : undefined,
      message: normalizeErrorMessage(body?.message || STATUS_MESSAGE_MAP[status] || `请求失败 (${status})`),
    };
  } catch {
    // 响应体不是合法 JSON，使用状态码映射
    return { message: STATUS_MESSAGE_MAP[status] || `请求失败 (${status})` };
  }
}

/**
 * 通用 API 客户端
 * <p>
 * 自动解析响应、弹出错误 toast（可通过 silent 选项关闭）。
 * 收到 401 时自动清除本地 token 并静默处理，不弹 toast。
 * </p>
 */
export async function apiClient<T>(
  endpoint: string,
  init?: ApiRequestOptions,
): Promise<T> {
    const { silent, skipAuth, ...fetchInit } = init || {};
  const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;

  const token = skipAuth ? null : getStoredAccessToken();
  const mergedHeaders = new Headers(fetchInit.headers ?? {});
  if (!mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }
  if (token && !mergedHeaders.has('Authorization')) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchInit,
      // SSR 详情页需实时数据，避免 Next 默认缓存导致后端恢复后仍 404
      cache: fetchInit.cache ?? 'no-store',
      headers: mergedHeaders,
    });
  } catch {
    if (!silent && typeof window !== 'undefined') {
      toast.error('网络连接失败，请检查网络后重试');
    }
    throw new ApiException(0, undefined, '网络连接失败');
  }

  if (!response.ok) {
    const { code, message } = await extractError(response, response.status);

    // 401 统一静默处理：清除过期 token，不弹 toast
    if (response.status === 401 && typeof window !== 'undefined') {
      storage.remove(TOKEN_KEY);
      throw new ApiException(response.status, code, message);
    }

    if (!silent && typeof window !== 'undefined') {
      toast.error(message);
    }

    throw new ApiException(response.status, code, message);
  }

  return response.json();
}

export const apiGet = <T>(endpoint: string, init?: ApiRequestOptions) =>
  apiClient<T>(endpoint, { ...init, method: 'GET' });

export const apiPost = <T>(endpoint: string, data?: unknown, init?: ApiRequestOptions) =>
  apiClient<T>(endpoint, { ...init, method: 'POST', body: data ? JSON.stringify(data) : undefined });

export const apiPut = <T>(endpoint: string, data?: unknown, init?: ApiRequestOptions) =>
  apiClient<T>(endpoint, { ...init, method: 'PUT', body: data ? JSON.stringify(data) : undefined });

export const apiDelete = <T>(endpoint: string, init?: ApiRequestOptions) =>
  apiClient<T>(endpoint, { ...init, method: 'DELETE' });
