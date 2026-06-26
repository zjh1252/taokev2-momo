import { apiClient } from '@/lib/api-client';
import type {
  InstitutionFilters,
  InstitutionsResponse,
  InstitutionApplicationsResponse
} from './types';

export function buildInstitutionParams(
  filters: InstitutionFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：机构列表 */
export async function getInstitutions(
  filters: InstitutionFilters
): Promise<InstitutionsResponse> {
  const params = buildInstitutionParams(filters);
  return apiClient<InstitutionsResponse>(
    `/institutions?${params.toString()}`
  );
}

/** 客户端：机构申请列表 */
export async function getInstitutionApplications(
  filters: InstitutionFilters
): Promise<InstitutionApplicationsResponse> {
  const params = buildInstitutionParams(filters);
  return apiClient<InstitutionApplicationsResponse>(
    `/institutions/applications?${params.toString()}`
  );
}

/** 审核通过 */
export async function approveInstitutionApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(
    `/institutions/applications/${userId}/approve`,
    { method: 'PUT' }
  );
}

/** 驳回申请 */
export async function rejectInstitutionApplication(
  userId: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/institutions/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

/** 获取机构申请详情 */
export async function getInstitutionApplicationDetail(userId: number) {
  return apiClient<{ code: number; message: string; data: import('@/features/trainers/api/types').AdminApplicationDetail }>(
    `/institutions/applications/${userId}/detail`
  );
}

/** 设为/取消培训协会 */
export async function setInstitutionAssociation(
  id: number,
  association: boolean
) {
  return apiClient<{ code: number; message: string }>(
    `/institutions/${id}/association`,
    { method: 'PUT', body: JSON.stringify({ association }) }
  );
}
