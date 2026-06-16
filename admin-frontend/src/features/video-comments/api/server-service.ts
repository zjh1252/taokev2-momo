import { serverFetch } from '@/lib/server-fetch';
import type { VideoCommentFilters, VideoCommentsResponse } from './types';
import { buildVideoCommentParams } from './service';

export async function getVideoCommentsFromServer(
  filters: VideoCommentFilters
): Promise<VideoCommentsResponse> {
  const params = buildVideoCommentParams(filters);
  return serverFetch<VideoCommentsResponse['data']>(
    `/admin/video-comments?${params.toString()}`
  ) as Promise<VideoCommentsResponse>;
}
