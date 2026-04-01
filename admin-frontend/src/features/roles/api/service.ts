import { apiClient } from '@/lib/api-client';
import type { Role, SaveRolePayload, AssignPermissionsPayload } from './types';

type ApiResp<T> = { code: number; message: string; data: T };

export async function getRoles() {
  return apiClient<ApiResp<Role[]>>('/roles');
}

export async function createRole(payload: SaveRolePayload) {
  return apiClient<ApiResp<Role>>('/roles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateRole(id: number, payload: SaveRolePayload) {
  return apiClient<ApiResp<Role>>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteRole(id: number) {
  return apiClient<ApiResp<null>>(`/roles/${id}`, {
    method: 'DELETE'
  });
}

export async function assignPermissions(roleId: number, payload: AssignPermissionsPayload) {
  return apiClient<ApiResp<null>>(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
