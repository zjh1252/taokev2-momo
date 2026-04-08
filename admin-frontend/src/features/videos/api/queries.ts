import { queryOptions } from '@tanstack/react-query';
import { getVideos } from './service';
import type { VideoFilters } from './types';

export const videoKeys = {
  all: ['videos'] as const,
  list: (filters: VideoFilters) =>
    [...videoKeys.all, 'list', filters] as const
};

export const videosQueryOptions = (filters: VideoFilters) =>
  queryOptions({
    queryKey: videoKeys.list(filters),
    queryFn: () => getVideos(filters)
  });
