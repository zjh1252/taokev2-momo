import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createRole, updateRole, deleteRole, assignPermissions } from './service';
import { roleKeys } from './queries';
import type { SaveRolePayload, AssignPermissionsPayload } from './types';

export const createRoleMutation = mutationOptions({
  mutationFn: (data: SaveRolePayload) => createRole(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: roleKeys.all });
  }
});

export const updateRoleMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: SaveRolePayload }) =>
    updateRole(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: roleKeys.all });
  }
});

export const deleteRoleMutation = mutationOptions({
  mutationFn: (id: number) => deleteRole(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: roleKeys.all });
  }
});

export const assignPermissionsMutation = mutationOptions({
  mutationFn: ({ roleId, data }: { roleId: number; data: AssignPermissionsPayload }) =>
    assignPermissions(roleId, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: roleKeys.all });
  }
});
