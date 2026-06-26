import { apiClient } from '@/lib/api-client';
import type {
  VideoOrderFilters,
  VideoOrdersResponse,
  VideoOrderDetailResponse
} from './types';

export function buildVideoOrderParams(filters: VideoOrderFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.videoTitle) params.set('videoTitle', filters.videoTitle);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.status) params.set('status', filters.status);
  if (filters.publisher) params.set('publisher', filters.publisher);
  return params;
}

export async function getVideoOrders(
  filters: VideoOrderFilters
): Promise<VideoOrdersResponse> {
  const params = buildVideoOrderParams(filters);
  return apiClient<VideoOrdersResponse>(`/video-orders?${params.toString()}`);
}

export async function getVideoOrderDetail(
  id: number
): Promise<VideoOrderDetailResponse> {
  return apiClient<VideoOrderDetailResponse>(`/video-orders/${id}`);
}

export async function refreshVideoOrderStatus(orderNo: string) {
  return apiClient<{ code: number; message: string }>(
    `/video-orders/${encodeURIComponent(orderNo)}/refresh`,
    { method: 'POST' }
  );
}
