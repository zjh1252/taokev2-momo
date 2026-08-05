import { queryOptions } from '@tanstack/react-query';
import {
  getAllianceAmbassadorApplicationDetail,
  getAllianceAmbassadorApplications
} from './service';
import type { AllianceAmbassadorApplicationFilters } from './types';

export const allianceAmbassadorKeys = {
  all: ['alliance-ambassadors'] as const,
  applications: (filters: AllianceAmbassadorApplicationFilters) =>
    [...allianceAmbassadorKeys.all, 'applications', filters] as const,
  detail: (id: number) =>
    [...allianceAmbassadorKeys.all, 'applications', id] as const
};

export const allianceAmbassadorApplicationsQueryOptions = (
  filters: AllianceAmbassadorApplicationFilters
) =>
  queryOptions({
    queryKey: allianceAmbassadorKeys.applications(filters),
    queryFn: () => getAllianceAmbassadorApplications(filters)
  });

export const allianceAmbassadorApplicationDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: allianceAmbassadorKeys.detail(id),
    queryFn: () => getAllianceAmbassadorApplicationDetail(id)
  });
