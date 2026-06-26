import { queryOptions } from '@tanstack/react-query';
import { getApplications, getTrainerDetail, getTrainers } from './service';
import type { AdminTrainer, AdminTrainerDetail, TrainerFilters } from './types';

export type { AdminTrainer, AdminTrainerDetail };

export const trainerKeys = {
  all: ['trainers'] as const,
  list: (filters: TrainerFilters) => [...trainerKeys.all, 'list', filters] as const,
  applications: (filters: TrainerFilters) =>
    [...trainerKeys.all, 'applications', filters] as const,
  detail: (id: number) => [...trainerKeys.all, 'detail', id] as const
};

export const trainersQueryOptions = (filters: TrainerFilters) =>
  queryOptions({
    queryKey: trainerKeys.list(filters),
    queryFn: () => getTrainers(filters)
  });

export const trainerApplicationsQueryOptions = (filters: TrainerFilters) =>
  queryOptions({
    queryKey: trainerKeys.applications(filters),
    queryFn: () => getApplications(filters)
  });

export const trainerDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: trainerKeys.detail(id),
    queryFn: () => getTrainerDetail(id)
  });
