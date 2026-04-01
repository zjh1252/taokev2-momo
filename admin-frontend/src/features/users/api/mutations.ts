import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { updateUserStatus } from './service';
import { userKeys } from './queries';
import type { UpdateUserStatusPayload } from './types';

export const updateUserStatusMutation = mutationOptions({
  mutationFn: ({
    id,
    payload
  }: {
    id: number;
    payload: UpdateUserStatusPayload;
  }) => updateUserStatus(id, payload),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});
