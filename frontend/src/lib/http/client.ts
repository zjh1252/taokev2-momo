import { toast } from 'sonner';
import {
  authHeaders,
  clearAuthTokens,
  getAccessToken,
  isValidAccessToken,
  parseBearerToken,
  redirectToLogin,
} from '@/lib/auth/token';
import { ROUTES } from '@/config/routes';
import { getApiBaseUrl } from '@/lib/env/client';

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

/** 扩展选项：silent 为 true 时不弹 toast；skipAuth 为 true 时不附带 Authorization；optionalAuth 有 token 则附带，无 token 也允许请求 */
export interface ApiRequestOptions extends RequestInit {
  silent?: boolean;
  skipAuth?: boolean;
  optionalAuth?: boolean;
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
 * 合并请求头并注入合法 Authorization。
 * <p>
 * 调用方若传入非法 Authorization（空 Bearer、Bearer no-cache 等）会被剥离；
 * 以 localStorage 中的合法 token 为准重新写入。无合法 token 且非 skipAuth 时返回 null，
 * 由调用方中止请求并跳转登录。
 * </p>
 */
function buildHeaders(
  init: RequestInit | undefined,
  skipAuth: boolean,
  optionalAuth = false,
): Headers | null {
  const mergedHeaders = new Headers(init?.headers ?? {});
  if (!mergedHeaders.has('Content-Type') && !(init?.body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  if (skipAuth) {
    mergedHeaders.delete('Authorization');
    return mergedHeaders;
  }

  // 剥掉调用方误塞的非法 Authorization（如 Bearer no-cache）
  const existingRaw = mergedHeaders.get('Authorization');
  if (existingRaw && !parseBearerToken(existingRaw)) {
    mergedHeaders.delete('Authorization');
  }

  const token = getAccessToken();
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
    return mergedHeaders;
  }

  // 存储无 token：若调用方带来了合法 Authorization 可沿用；否则中止
  if (parseBearerToken(mergedHeaders.get('Authorization'))) {
    return mergedHeaders;
  }

  // 可选登录：无 token 也允许继续请求
  if (optionalAuth) {
    mergedHeaders.delete('Authorization');
    return mergedHeaders;
  }

  return null;
}

function handleAuthRequired(silent?: boolean): never {
  if (typeof window !== 'undefined') {
    if (!silent) {
      toast.error('登录已过期，请重新登录');
    }
    clearAuthTokens();
    const path = window.location.pathname.replace(/^\/(zh|en)(?=\/|$)/, '') || '/';
    if (path !== ROUTES.LOGIN && path !== ROUTES.REGISTER) {
      redirectToLogin();
    }
  }
  throw new ApiException(401, undefined, '登录已过期，请重新登录');
}

/**
 * 通用 API 客户端
 * <p>
 * 自动解析响应、弹出错误 toast（可通过 silent 选项关闭）。
 * 收到 401 或本地无合法 token 时清除凭证并跳转登录，禁止把非法值塞进 Authorization。
 * </p>
 */
export async function apiClient<T>(
  endpoint: string,
  init?: ApiRequestOptions,
): Promise<T> {
  const { silent, skipAuth, optionalAuth, ...fetchInit } = init || {};
  const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;

  // RSC 无 localStorage：不能按「未登录」中止请求，否则公开列表/推荐位会被
  // page 层 .catch(() => 空数据) 吞掉，页面显示「共 0 条」。由后端决定是否 401。
  const effectiveOptionalAuth =
    !!optionalAuth || (typeof window === 'undefined' && !skipAuth);

  const mergedHeaders = buildHeaders(fetchInit, !!skipAuth, effectiveOptionalAuth);
  if (!mergedHeaders) {
    handleAuthRequired(silent);
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

    // 401：清除脏/过期 token；非 skipAuth / optionalAuth 时跳转登录
    if (response.status === 401 && typeof window !== 'undefined') {
      clearAuthTokens();
      if (!skipAuth && !optionalAuth) {
        if (!silent) {
          toast.error(message || '登录已过期，请重新登录');
        }
        // 已在登录页则不再跳转，避免死循环刷新
        const path = window.location.pathname.replace(/^\/(zh|en)(?=\/|$)/, '') || '/';
        if (path !== ROUTES.LOGIN && path !== ROUTES.REGISTER) {
          redirectToLogin();
        }
      }
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

/** 供仍手写 fetch 的上传等场景复用 */
export { authHeaders, getAccessToken, isValidAccessToken };
