import { queryOptions } from '@tanstack/react-query';
import { getTrainerCases, getTrainerCaseDetail } from './service';
import type { TrainerCaseFilters } from './types';

export const trainerCaseKeys = {
  all: ['trainer-cases'] as const,
  list: (filters: TrainerCaseFilters) =>
    [...trainerCaseKeys.all, 'list', filters] as const,
  detail: (id: number) =>
    [...trainerCaseKeys.all, 'detail', id] as const
};

export const trainerCasesQueryOptions = (filters: TrainerCaseFilters) =>
  queryOptions({
    queryKey: trainerCaseKeys.list(filters),
    queryFn: () => getTrainerCases(filters)
  });

export const trainerCaseDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: trainerCaseKeys.detail(id),
    queryFn: () => getTrainerCaseDetail(id)
  });
