import { apiClient } from '@/lib/api-client';
import type {
  EnterpriseBuyerFilters,
  EnterpriseBuyersResponse,
  EnterpriseBuyerApplicationsResponse
} from './types';

export function buildEnterpriseBuyerParams(
  filters: EnterpriseBuyerFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：企业采购方列表 */
export async function getEnterpriseBuyers(
  filters: EnterpriseBuyerFilters
): Promise<EnterpriseBuyersResponse> {
  const params = buildEnterpriseBuyerParams(filters);
  return apiClient<EnterpriseBuyersResponse>(
    `/enterprise-buyers?${params.toString()}`
  );
}

/** 客户端：企业采购方申请列表 */
export async function getEnterpriseBuyerApplications(
  filters: EnterpriseBuyerFilters
): Promise<EnterpriseBuyerApplicationsResponse> {
  const params = buildEnterpriseBuyerParams(filters);
  return apiClient<EnterpriseBuyerApplicationsResponse>(
    `/enterprise-buyers/applications?${params.toString()}`
  );
}

/** 审核通过 */
export async function approveEnterpriseBuyerApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-buyers/applications/${userId}/approve`,
    { method: 'PUT' }
  );
}

/** 驳回申请 */
export async function rejectEnterpriseBuyerApplication(
  userId: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-buyers/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
