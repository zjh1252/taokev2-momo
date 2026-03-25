// TODO: 完善 API 客户端封装

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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

export async function apiClient<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiException(response.status);
  }

  return response.json();
}

export const apiGet = <T>(endpoint: string, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'GET' });

export const apiPost = <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'POST', body: data ? JSON.stringify(data) : undefined });

export const apiPut = <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'PUT', body: data ? JSON.stringify(data) : undefined });

export const apiDelete = <T>(endpoint: string, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'DELETE' });
