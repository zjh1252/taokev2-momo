import { apiClient } from '@/lib/api-client';
import type {
  DemandFilters,
  DemandsResponse,
  DemandDetailResponse
} from './types';

export function buildDemandParams(filters: DemandFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.demandType) params.set('demandType', filters.demandType);
  if (filters.keyword) params.set('keyword', filters.keyword);
  return params;
}

/** 需求列表 */
export async function getDemands(
  filters: DemandFilters
): Promise<DemandsResponse> {
  const params = buildDemandParams(filters);
  return apiClient<DemandsResponse>(`/demands?${params.toString()}`);
}

/** 需求详情 */
export async function getDemandDetail(
  id: number
): Promise<DemandDetailResponse> {
  return apiClient<DemandDetailResponse>(`/demands/${id}`);
}

/** 变更需求状态 */
export async function changeDemandStatus(
  id: number,
  newStatus: number,
  content?: string
) {
  return apiClient<{ code: number; message: string }>(
    `/demands/${id}/status`,
    { method: 'PUT', body: JSON.stringify({ newStatus, content }) }
  );
}

/** 添加跟进记录 */
export async function addDemandFollowUp(
  id: number,
  action: string,
  content: string
) {
  return apiClient<{ code: number; message: string }>(
    `/demands/${id}/follow-ups`,
    { method: 'POST', body: JSON.stringify({ action, content }) }
  );
}
