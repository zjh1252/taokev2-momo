import { queryOptions } from '@tanstack/react-query';
import { getIndices } from './service';

export const searchKeys = {
  all: ['search'] as const,
  indices: () => [...searchKeys.all, 'indices'] as const
};

export function indicesQueryOptions() {
  return queryOptions({
    queryKey: searchKeys.indices(),
    queryFn: () => getIndices()
  });
}
