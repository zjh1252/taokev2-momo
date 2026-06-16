import { apiClient } from '@/lib/api-client';
import type {
  TrainerMessageFilters,
  TrainerMessagesResponse,
  TrainerMessageDetailResponse,
} from './types';

export function buildMessageParams(
  filters: TrainerMessageFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.trainerUserId)
    params.set('trainerUserId', String(filters.trainerUserId));
  if (filters.keyword) params.set('keyword', filters.keyword);
  return params;
}

/** 客户端：留言列表 */
export async function getTrainerMessages(
  filters: TrainerMessageFilters,
): Promise<TrainerMessagesResponse> {
  const params = buildMessageParams(filters);
  return apiClient<TrainerMessagesResponse>(
    `/trainer-messages?${params.toString()}`,
  );
}

/** 客户端：留言详情 */
export async function getTrainerMessageDetail(
  id: number,
): Promise<TrainerMessageDetailResponse> {
  return apiClient<TrainerMessageDetailResponse>(`/trainer-messages/${id}`);
}

/** 标记为已处理 */
export async function markTrainerMessageProcessed(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/trainer-messages/${id}/process`,
    { method: 'PUT' },
  );
}

/** 转为培训需求 */
export async function convertTrainerMessageToDemand(id: number) {
  return apiClient<{ code: number; message: string; data: { id: number; demandNo: string } }>(
    `/trainer-messages/${id}/to-demand`,
    { method: 'POST' },
  );
}
