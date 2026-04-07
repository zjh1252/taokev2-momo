import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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

/** 扩展选项：silent 为 true 时不弹 toast，由调用方自行处理 */
export interface ApiRequestOptions extends RequestInit {
  silent?: boolean;
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
async function extractErrorMessage(response: Response, status: number): Promise<string> {
  try {
    const body = await response.json();
    if (body?.message) return body.message;
  } catch {
    // 响应体不是合法 JSON，使用状态码映射
  }
  return STATUS_MESSAGE_MAP[status] || `请求失败 (${status})`;
}

/**
 * 通用 API 客户端
 * <p>自动解析响应、弹出错误 toast（可通过 silent 选项关闭）</p>
 */
export async function apiClient<T>(
  endpoint: string,
  init?: ApiRequestOptions,
): Promise<T> {
  const { silent, ...fetchInit } = init || {};
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchInit,
    headers: {
      'Content-Type': 'application/json',
      ...fetchInit.headers,
    },
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, response.status);

    if (!silent && typeof window !== 'undefined') {
      toast.error(message);
    }

    throw new ApiException(response.status, undefined, message);
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
