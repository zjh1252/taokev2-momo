import { apiClient } from '@/lib/api-client';
import type {
  TrainerHighlightFilters,
  TrainerHighlightsResponse,
  TrainerHighlightDetailResponse
} from './types';

export function buildHighlightParams(
  filters: TrainerHighlightFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.trainerId) params.set('trainerId', String(filters.trainerId));
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：精彩瞬间列表 */
export async function getTrainerHighlights(
  filters: TrainerHighlightFilters
): Promise<TrainerHighlightsResponse> {
  const params = buildHighlightParams(filters);
  return apiClient<TrainerHighlightsResponse>(
    `/trainer-highlights?${params.toString()}`
  );
}

/** 客户端：精彩瞬间详情 */
export async function getTrainerHighlightDetail(
  id: number
): Promise<TrainerHighlightDetailResponse> {
  return apiClient<TrainerHighlightDetailResponse>(
    `/trainer-highlights/${id}`
  );
}

/** 审核通过 */
export async function approveTrainerHighlight(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/trainer-highlights/${id}/approve`,
    { method: 'PUT' }
  );
}

/** 审核驳回 */
export async function rejectTrainerHighlight(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/trainer-highlights/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
