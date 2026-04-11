import { apiClient } from '@/lib/api-client';
import type {
  TrainerCaseFilters,
  TrainerCasesResponse,
  TrainerCaseDetailResponse
} from './types';

export function buildCaseParams(filters: TrainerCaseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.trainerId) params.set('trainerId', String(filters.trainerId));
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：案例列表 */
export async function getTrainerCases(
  filters: TrainerCaseFilters
): Promise<TrainerCasesResponse> {
  const params = buildCaseParams(filters);
  return apiClient<TrainerCasesResponse>(
    `/trainer-cases?${params.toString()}`
  );
}

/** 客户端：案例详情 */
export async function getTrainerCaseDetail(
  id: number
): Promise<TrainerCaseDetailResponse> {
  return apiClient<TrainerCaseDetailResponse>(`/trainer-cases/${id}`);
}

/** 审核通过 */
export async function approveTrainerCase(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/trainer-cases/${id}/approve`,
    { method: 'PUT' }
  );
}

/** 审核驳回 */
export async function rejectTrainerCase(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/trainer-cases/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
