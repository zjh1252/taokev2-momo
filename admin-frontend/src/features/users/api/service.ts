import { apiClient } from '@/lib/api-client';
import type {
  UserFilters,
  UsersResponse,
  UpdateUserStatusPayload,
  UserBusinessRole,
  AssignBusinessRolesPayload
} from './types';

type ApiResp<T> = { code: number; message: string; data: T };

export function buildUserParams(filters: UserFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端调用：走 BFF route handler */
export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const params = buildUserParams(filters);
  return apiClient<UsersResponse>(`/users?${params.toString()}`);
}

export async function updateUserStatus(
  id: number,
  payload: UpdateUserStatusPayload
) {
  return apiClient<{ code: number; message: string; data: null }>(
    `/users/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    }
  );
}

export async function getUserBusinessRoles(userId: number) {
  return apiClient<ApiResp<UserBusinessRole[]>>(`/users/${userId}/roles`);
}

export async function assignBusinessRoles(
  userId: number,
  payload: AssignBusinessRolesPayload
) {
  return apiClient<ApiResp<UserBusinessRole[]>>(`/users/${userId}/roles`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
