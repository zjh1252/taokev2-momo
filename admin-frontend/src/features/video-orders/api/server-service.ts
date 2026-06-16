import { serverFetch } from '@/lib/server-fetch';
import type { VideoOrderFilters, VideoOrdersResponse } from './types';
import { buildVideoOrderParams } from './service';

export async function getVideoOrdersFromServer(
  filters: VideoOrderFilters
): Promise<VideoOrdersResponse> {
  const params = buildVideoOrderParams(filters);
  return serverFetch<VideoOrdersResponse['data']>(
    `/admin/video-orders?${params.toString()}`
  ) as Promise<VideoOrdersResponse>;
}
