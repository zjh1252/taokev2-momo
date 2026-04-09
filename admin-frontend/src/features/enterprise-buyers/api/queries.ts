import { queryOptions } from '@tanstack/react-query';
import {
  getEnterpriseBuyers,
  getEnterpriseBuyerApplications
} from './service';
import type { EnterpriseBuyerFilters } from './types';

export const enterpriseBuyerKeys = {
  all: ['enterprise-buyers'] as const,
  list: (filters: EnterpriseBuyerFilters) =>
    [...enterpriseBuyerKeys.all, 'list', filters] as const,
  applications: (filters: EnterpriseBuyerFilters) =>
    [...enterpriseBuyerKeys.all, 'applications', filters] as const
};

export const enterpriseBuyersQueryOptions = (
  filters: EnterpriseBuyerFilters
) =>
  queryOptions({
    queryKey: enterpriseBuyerKeys.list(filters),
    queryFn: () => getEnterpriseBuyers(filters)
  });

export const enterpriseBuyerApplicationsQueryOptions = (
  filters: EnterpriseBuyerFilters
) =>
  queryOptions({
    queryKey: enterpriseBuyerKeys.applications(filters),
    queryFn: () => getEnterpriseBuyerApplications(filters)
  });
