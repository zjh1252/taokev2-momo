import { apiClient } from '@/lib/api-client';
import type {
  ApiResult,
  LoginPayload,
  RegisterPayload,
  SendCodePayload,
  UserProfile
} from './types';

export async function login(data: LoginPayload): Promise<ApiResult> {
  return apiClient<ApiResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function register(data: RegisterPayload): Promise<ApiResult> {
  return apiClient<ApiResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function sendCode(data: SendCodePayload): Promise<ApiResult> {
  return apiClient<ApiResult>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function logout(): Promise<ApiResult> {
  return apiClient<ApiResult>('/auth/logout', { method: 'POST' });
}

export async function refreshToken(): Promise<ApiResult> {
  return apiClient<ApiResult>('/auth/refresh', { method: 'POST' });
}

export async function getMe(): Promise<ApiResult<UserProfile>> {
  return apiClient<ApiResult<UserProfile>>('/auth/me');
}

export async function changePassword(data: {
  oldPassword?: string;
  newPassword: string;
}): Promise<ApiResult> {
  return apiClient<ApiResult>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
