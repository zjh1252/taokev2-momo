import { apiClient } from '@/lib/api-client';
import type { VideoFilters, VideosResponse } from './types';

export function buildVideoParams(filters: VideoFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：录播课列表 */
export async function getVideos(
  filters: VideoFilters
): Promise<VideosResponse> {
  const params = buildVideoParams(filters);
  return apiClient<VideosResponse>(`/videos?${params.toString()}`);
}

/** 审核通过 */
export async function approveVideo(videoId: number) {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/approve`,
    { method: 'PUT' }
  );
}

/** 审核驳回 */
export async function rejectVideo(videoId: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

/** 下架录播课 */
export async function unpublishVideo(videoId: number) {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/unpublish`,
    { method: 'PUT' }
  );
}

/** 重新上架录播课 */
export async function publishVideo(videoId: number) {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/publish`,
    { method: 'PUT' }
  );
}
