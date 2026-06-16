import { apiClient } from '@/lib/api-client';
import type {
  User,
  UserDetailResponse,
  UserFilters,
  UsersResponse,
  UpdateUserStatusPayload,
  UserBusinessRole,
  AssignBusinessRolesPayload,
  CreateUserPayload
} from './types';

type ApiResp<T> = { code: number; message: string; data: T };

export async function getUserDetail(id: number): Promise<UserDetailResponse> {
  return apiClient<UserDetailResponse>(`/users/${id}`);
}

export function buildUserParams(filters: UserFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.role) params.set('role', filters.role);
  if (filters.regOrigin) params.set('regOrigin', filters.regOrigin);
  if (filters.realNameCertStatus) {
    params.set('realNameCertStatus', filters.realNameCertStatus);
  }
  return params;
}

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const params = buildUserParams(filters);
  return apiClient<UsersResponse>(`/users?${params.toString()}`);
}

export async function createUser(payload: CreateUserPayload) {
  return apiClient<ApiResp<User>>('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
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
