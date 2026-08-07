import { apiClient } from '@/lib/api-client';
import type {
  VideoFilters,
  VideosResponse,
  VideoDetailResponse,
  SaveVideoPayload
} from './types';

export function buildVideoParams(filters: VideoFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortDirection) params.set('sortDirection', filters.sortDirection);
  return params;
}

/** 创建录播课（映射为后台 AdminSaveVideoRequest） */
export async function createVideo(payload: SaveVideoPayload) {
  const body = {
    title: payload.title,
    videoType: payload.videoType,
    categoryId: payload.categoryId,
    subCategoryId: payload.subCategoryId,
    coverUrl: payload.coverUrl,
    videoUrl: payload.videoUrl,
    externalUrl: payload.externalUrl,
    intro: payload.intro,
    teacherName: payload.teacherName,
    trainerId: payload.trainerId,
    price: payload.price,
    companyPrice: payload.companyPrice,
    maxPurchaseQty: payload.maxPurchaseQty,
    isFree: payload.isFree,
    keywords: payload.keywords,
    publishMode: payload.directPublish ? 'PUBLISHED' : 'PENDING',
    publisherSubject: payload.publisherType,
    publisherUserId: payload.publisherId,
    durationMinutes: payload.duration
      ? Math.round(payload.duration / 60)
      : undefined
  };
  return apiClient<{ code: number; message: string; data: { id: number } }>(
    '/videos',
    { method: 'POST', body: JSON.stringify(body) }
  );
}

/** 客户端：录播课列表 */
export async function getVideos(
  filters: VideoFilters
): Promise<VideosResponse> {
  const params = buildVideoParams(filters);
  return apiClient<VideosResponse>(`/videos?${params.toString()}`);
}

/** 客户端：录播课详情 */
export async function getVideoDetail(id: number): Promise<VideoDetailResponse> {
  return apiClient<VideoDetailResponse>(`/videos/${id}`);
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

/** 推荐录播课（列表置顶或列表推荐） */
export async function featureVideo(videoId: number, type: 'pin' | 'recommend') {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/feature?type=${type}`,
    { method: 'PUT' }
  );
}

/** 取消推荐 */
export async function unfeatureVideo(videoId: number) {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/unfeature`,
    { method: 'PUT' }
  );
}

/** 设置置顶优先级 */
export async function updateVideoStickyPriority(
  videoId: number,
  stickyPriority: number
) {
  return apiClient<{ code: number; message: string }>(
    `/videos/${videoId}/sticky-priority`,
    { method: 'PUT', body: JSON.stringify({ stickyPriority }) }
  );
}
