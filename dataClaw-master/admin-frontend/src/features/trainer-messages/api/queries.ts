import { queryOptions } from '@tanstack/react-query';
import { getTrainerMessages, getTrainerMessageDetail } from './service';
import type { TrainerMessageFilters } from './types';

export const trainerMessageKeys = {
  all: ['trainer-messages'] as const,
  list: (filters: TrainerMessageFilters) =>
    [...trainerMessageKeys.all, 'list', filters] as const,
  detail: (id: number) => [...trainerMessageKeys.all, 'detail', id] as const,
};

export const trainerMessagesQueryOptions = (filters: TrainerMessageFilters) =>
  queryOptions({
    queryKey: trainerMessageKeys.list(filters),
    queryFn: () => getTrainerMessages(filters),
  });

export const trainerMessageDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: trainerMessageKeys.detail(id),
    queryFn: () => getTrainerMessageDetail(id),
  });
