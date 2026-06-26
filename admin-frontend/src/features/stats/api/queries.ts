import { queryOptions } from '@tanstack/react-query';
import { getPendingCounts } from './service';

export const statsKeys = {
  all: ['stats'] as const,
  pendingCounts: () => [...statsKeys.all, 'pending-counts'] as const
};

export const pendingCountsQueryOptions = () =>
  queryOptions({
    queryKey: statsKeys.pendingCounts(),
    queryFn: getPendingCounts,
    staleTime: 60_000,
    select: (res) => res.data ?? {}
  });
