import { queryOptions } from '@tanstack/react-query';
import { getInstitutionEmployees, getInstitutionEmployeeApplications } from './service';
import type { InstitutionEmployeeFilters } from './types';

export const instEmployeeKeys = {
  all: ['institution-employees'] as const,
  list: (filters: InstitutionEmployeeFilters) =>
    [...instEmployeeKeys.all, 'list', filters] as const,
  applications: (filters: InstitutionEmployeeFilters) =>
    [...instEmployeeKeys.all, 'applications', filters] as const
};

export const instEmployeesQueryOptions = (filters: InstitutionEmployeeFilters) =>
  queryOptions({
    queryKey: instEmployeeKeys.list(filters),
    queryFn: () => getInstitutionEmployees(filters)
  });

export const instEmployeeApplicationsQueryOptions = (
  filters: InstitutionEmployeeFilters
) =>
  queryOptions({
    queryKey: instEmployeeKeys.applications(filters),
    queryFn: () => getInstitutionEmployeeApplications(filters)
  });
