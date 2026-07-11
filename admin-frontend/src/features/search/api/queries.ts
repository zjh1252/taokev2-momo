import { queryOptions } from '@tanstack/react-query';
import { getIndices, getSearchOverview } from './service';

export const searchKeys = {
  all: ['search'] as const,
  overview: () => [...searchKeys.all, 'overview'] as const,
  indices: () => [...searchKeys.all, 'indices'] as const
};

export function searchOverviewQueryOptions() {
  return queryOptions({
    queryKey: searchKeys.overview(),
    queryFn: () => getSearchOverview()
  });
}

export function indicesQueryOptions() {
  return queryOptions({
    queryKey: searchKeys.indices(),
    queryFn: () => getIndices()
  });
}
