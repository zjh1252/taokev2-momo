import { queryOptions } from '@tanstack/react-query';
import { getDemands, getDemandDetail } from './service';
import type { DemandFilters } from './types';

export const demandKeys = {
  all: ['demands'] as const,
  list: (filters: DemandFilters) =>
    [...demandKeys.all, 'list', filters] as const,
  detail: (id: number) => [...demandKeys.all, 'detail', id] as const
};

export const demandsQueryOptions = (filters: DemandFilters) =>
  queryOptions({
    queryKey: demandKeys.list(filters),
    queryFn: () => getDemands(filters)
  });

export const demandDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: demandKeys.detail(id),
    queryFn: () => getDemandDetail(id)
  });
