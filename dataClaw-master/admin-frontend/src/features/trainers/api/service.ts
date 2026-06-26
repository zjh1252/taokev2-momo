import { apiClient } from '@/lib/api-client';
import type {
  TrainerFilters,
  TrainersResponse,
  ApplicationsResponse
} from './types';

export function buildTrainerParams(filters: TrainerFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：专家列表 */
export async function getTrainers(
  filters: TrainerFilters
): Promise<TrainersResponse> {
  const params = buildTrainerParams(filters);
  return apiClient<TrainersResponse>(`/trainers?${params.toString()}`);
}

/** 客户端：专家申请列表 */
export async function getApplications(
  filters: TrainerFilters
): Promise<ApplicationsResponse> {
  const params = buildTrainerParams(filters);
  return apiClient<ApplicationsResponse>(
    `/trainers/applications?${params.toString()}`
  );
}

/** 审核通过 */
export async function approveApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(
    `/trainers/applications/${userId}/approve`,
    { method: 'PUT' }
  );
}

/** 驳回申请 */
export async function rejectApplication(
  userId: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/trainers/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

/** 切换专家推荐位 */
export async function setTrainerRecommended(
  trainerId: number,
  value: 0 | 1
) {
  return apiClient<{ code: number; message: string }>(
    `/trainers/${trainerId}/recommend?value=${value}`,
    { method: 'PATCH' }
  );
}
