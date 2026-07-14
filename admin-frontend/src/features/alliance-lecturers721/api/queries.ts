import { queryOptions } from '@tanstack/react-query';
import {
  getAllianceLecturer721ApplicationDetail,
  getAllianceLecturer721Applications
} from './service';
import type { AllianceLecturer721ApplicationFilters } from './types';

export const allianceLecturer721Keys = {
  all: ['alliance-lecturers721'] as const,
  applications: (filters: AllianceLecturer721ApplicationFilters) =>
    [...allianceLecturer721Keys.all, 'applications', filters] as const,
  detail: (id: number) =>
    [...allianceLecturer721Keys.all, 'applications', id] as const
};

export const allianceLecturer721ApplicationsQueryOptions = (
  filters: AllianceLecturer721ApplicationFilters
) =>
  queryOptions({
    queryKey: allianceLecturer721Keys.applications(filters),
    queryFn: () => getAllianceLecturer721Applications(filters)
  });

export const allianceLecturer721ApplicationDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: allianceLecturer721Keys.detail(id),
    queryFn: () => getAllianceLecturer721ApplicationDetail(id)
  });
