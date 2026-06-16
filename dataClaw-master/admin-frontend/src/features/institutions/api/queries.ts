import { queryOptions } from '@tanstack/react-query';
import { getInstitutions, getInstitutionApplications } from './service';
import type { InstitutionFilters } from './types';

export const institutionKeys = {
  all: ['institutions'] as const,
  list: (filters: InstitutionFilters) =>
    [...institutionKeys.all, 'list', filters] as const,
  applications: (filters: InstitutionFilters) =>
    [...institutionKeys.all, 'applications', filters] as const
};

export const institutionsQueryOptions = (filters: InstitutionFilters) =>
  queryOptions({
    queryKey: institutionKeys.list(filters),
    queryFn: () => getInstitutions(filters)
  });

export const institutionApplicationsQueryOptions = (
  filters: InstitutionFilters
) =>
  queryOptions({
    queryKey: institutionKeys.applications(filters),
    queryFn: () => getInstitutionApplications(filters)
  });
