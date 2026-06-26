import { apiClient } from '@/lib/api-client';
import type {
  EnterpriseAgentCertFilters,
  EnterpriseAgentCertPage,
  AdminEnterpriseAgentCert
} from './types';

export function buildParams(filters: EnterpriseAgentCertFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  return params;
}

export function getEnterpriseAgentCerts(filters: EnterpriseAgentCertFilters) {
  const params = buildParams(filters);
  return apiClient<EnterpriseAgentCertPage<AdminEnterpriseAgentCert>>(
    `/enterprise-agents/certifications/qualification?${params.toString()}`
  );
}

export function approveEnterpriseAgent(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-agents/certifications/qualification/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectEnterpriseAgent(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-agents/certifications/qualification/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
