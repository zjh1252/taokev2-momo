import { apiClient } from '@/lib/api-client';
import type {
  AdminBuyerRealNameCert,
  AdminBuyerWorkCert,
  RoleCertFilters,
  RoleCertPageResponse
} from './types';

export function buildRoleCertParams(filters: RoleCertFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  return params;
}

export function getBuyerRealNameCerts(filters: RoleCertFilters) {
  const params = buildRoleCertParams(filters);
  return apiClient<RoleCertPageResponse<AdminBuyerRealNameCert>>(
    `/enterprise-buyers/certifications/real-name?${params.toString()}`
  );
}

export function approveBuyerRealName(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-buyers/certifications/real-name/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectBuyerRealName(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-buyers/certifications/real-name/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

export function getBuyerWorkCerts(filters: RoleCertFilters) {
  const params = buildRoleCertParams(filters);
  return apiClient<RoleCertPageResponse<AdminBuyerWorkCert>>(
    `/enterprise-buyers/certifications/work-experiences?${params.toString()}`
  );
}

export function approveBuyerWork(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-buyers/certifications/work-experiences/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectBuyerWork(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/enterprise-buyers/certifications/work-experiences/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
