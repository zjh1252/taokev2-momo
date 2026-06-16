import { queryOptions } from '@tanstack/react-query';
import { getVideoOrders, getVideoOrderDetail } from './service';
import type { VideoOrderFilters } from './types';

export const videoOrderKeys = {
  all: ['video-orders'] as const,
  list: (filters: VideoOrderFilters) =>
    [...videoOrderKeys.all, 'list', filters] as const,
  detail: (id: number) => [...videoOrderKeys.all, 'detail', id] as const
};

export const videoOrdersQueryOptions = (filters: VideoOrderFilters) =>
  queryOptions({
    queryKey: videoOrderKeys.list(filters),
    queryFn: () => getVideoOrders(filters)
  });

export const videoOrderDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: videoOrderKeys.detail(id),
    queryFn: () => getVideoOrderDetail(id)
  });
