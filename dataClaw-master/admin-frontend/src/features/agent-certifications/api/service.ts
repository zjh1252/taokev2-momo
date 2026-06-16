import { apiClient } from '@/lib/api-client';
import type {
  RoleCertFilters,
  RoleCertPageResponse,
  AdminAgentWorkCert
} from './types';

export function buildRoleCertParams(filters: RoleCertFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  return params;
}

export function getAgentWorkCerts(filters: RoleCertFilters) {
  const params = buildRoleCertParams(filters);
  return apiClient<RoleCertPageResponse<AdminAgentWorkCert>>(
    `/agents/certifications/work-experiences?${params.toString()}`
  );
}

export function approveAgentWork(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/agents/certifications/work-experiences/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectAgentWork(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/agents/certifications/work-experiences/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
