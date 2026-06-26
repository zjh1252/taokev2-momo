import { queryOptions } from '@tanstack/react-query';
import { getTrainers, getApplications } from './service';
import type { TrainerFilters } from './types';

export const trainerKeys = {
  all: ['trainers'] as const,
  list: (filters: TrainerFilters) => [...trainerKeys.all, 'list', filters] as const,
  applications: (filters: TrainerFilters) =>
    [...trainerKeys.all, 'applications', filters] as const
};

export const trainersQueryOptions = (filters: TrainerFilters) =>
  queryOptions({
    queryKey: trainerKeys.list(filters),
    queryFn: () => getTrainers(filters)
  });

export const applicationsQueryOptions = (filters: TrainerFilters) =>
  queryOptions({
    queryKey: trainerKeys.applications(filters),
    queryFn: () => getApplications(filters)
  });
