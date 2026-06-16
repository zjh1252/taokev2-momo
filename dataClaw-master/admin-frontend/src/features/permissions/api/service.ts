import { apiClient } from '@/lib/api-client';
import type { Permission, SavePermissionPayload } from './types';

type ApiResp<T> = { code: number; message: string; data: T };

export async function getPermissionTree() {
  return apiClient<ApiResp<Permission[]>>('/permissions?tree=1');
}

export async function getPermissionList() {
  return apiClient<ApiResp<Permission[]>>('/permissions');
}

export async function createPermission(payload: SavePermissionPayload) {
  return apiClient<ApiResp<Permission>>('/permissions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updatePermission(id: number, payload: SavePermissionPayload) {
  return apiClient<ApiResp<Permission>>(`/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deletePermission(id: number) {
  return apiClient<ApiResp<null>>(`/permissions/${id}`, {
    method: 'DELETE'
  });
}
