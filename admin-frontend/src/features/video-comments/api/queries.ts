import { queryOptions } from '@tanstack/react-query';
import { getVideoComments } from './service';
import type { VideoCommentFilters } from './types';

export const videoCommentKeys = {
  all: ['video-comments'] as const,
  list: (filters: VideoCommentFilters) =>
    [...videoCommentKeys.all, 'list', filters] as const
};

export const videoCommentsQueryOptions = (filters: VideoCommentFilters) =>
  queryOptions({
    queryKey: videoCommentKeys.list(filters),
    queryFn: () => getVideoComments(filters)
  });
