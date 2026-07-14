import { queryOptions } from '@tanstack/react-query';
import {
  getAlliancePartnerApplicationDetail,
  getAlliancePartnerApplications
} from './service';
import type { AlliancePartnerApplicationFilters } from './types';

export const alliancePartnerKeys = {
  all: ['alliance-partners'] as const,
  applications: (filters: AlliancePartnerApplicationFilters) =>
    [...alliancePartnerKeys.all, 'applications', filters] as const,
  detail: (id: number) =>
    [...alliancePartnerKeys.all, 'applications', id] as const
};

export const alliancePartnerApplicationsQueryOptions = (
  filters: AlliancePartnerApplicationFilters
) =>
  queryOptions({
    queryKey: alliancePartnerKeys.applications(filters),
    queryFn: () => getAlliancePartnerApplications(filters)
  });

export const alliancePartnerApplicationDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: alliancePartnerKeys.detail(id),
    queryFn: () => getAlliancePartnerApplicationDetail(id)
  });
