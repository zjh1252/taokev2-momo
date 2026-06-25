import { apiClient } from '@/lib/api-client';
import type { EnterpriseAgentFilters, EnterpriseAgentsResponse, EnterpriseAgentApplicationsResponse } from './types';

export function buildEAParams(filters: EnterpriseAgentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getEnterpriseAgents(filters: EnterpriseAgentFilters): Promise<EnterpriseAgentsResponse> {
  return apiClient<EnterpriseAgentsResponse>(`/enterprise-agents?${buildEAParams(filters).toString()}`);
}

export async function getEnterpriseAgentApplications(filters: EnterpriseAgentFilters): Promise<EnterpriseAgentApplicationsResponse> {
  return apiClient<EnterpriseAgentApplicationsResponse>(`/enterprise-agents/applications?${buildEAParams(filters).toString()}`);
}

export async function approveEAApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(`/enterprise-agents/applications/${userId}/approve`, { method: 'PUT' });
}

export async function rejectEAApplication(userId: number, reason: string) {
  return apiClient<{ code: number; message: string }>(`/enterprise-agents/applications/${userId}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
}

/** 获取经纪公司申请详情 */
export async function getEAApplicationDetail(userId: number) {
  return apiClient<{ code: number; message: string; data: import('@/features/trainers/api/types').AdminApplicationDetail }>(
    `/enterprise-agents/applications/${userId}/detail`
  );
}
