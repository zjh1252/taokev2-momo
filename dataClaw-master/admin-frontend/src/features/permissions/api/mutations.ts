import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createPermission, updatePermission, deletePermission } from './service';
import { permissionKeys } from './queries';
import type { SavePermissionPayload } from './types';

export const createPermissionMutation = mutationOptions({
  mutationFn: (data: SavePermissionPayload) => createPermission(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: permissionKeys.all });
  }
});

export const updatePermissionMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: SavePermissionPayload }) =>
    updatePermission(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: permissionKeys.all });
  }
});

export const deletePermissionMutation = mutationOptions({
  mutationFn: (id: number) => deletePermission(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: permissionKeys.all });
  }
});
