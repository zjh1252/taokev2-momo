import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  VideoFilters,
  VideosResponse,
  VideoDetailResponse,
} from './types';
import { buildVideoParams } from './service';

/** 服务端预取：录播课列表 */
export async function getVideosFromServer(
  filters: VideoFilters
): Promise<VideosResponse> {
  const params = buildVideoParams(filters);
  return serverFetch(
    `/admin/videos?${params.toString()}`
  ) as Promise<VideosResponse>;
}

/** 服务端预取：录播课详情 */
export async function getVideoDetailFromServer(
  id: number
): Promise<VideoDetailResponse> {
  return serverFetch(`/admin/videos/${id}`) as Promise<VideoDetailResponse>;
}
