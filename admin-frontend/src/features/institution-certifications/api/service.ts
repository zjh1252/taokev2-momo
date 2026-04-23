import { apiClient } from '@/lib/api-client';
import type {
  InstitutionCertFilters,
  InstitutionCertPage,
  AdminInstitutionCompanyInfo
} from './types';

export function buildParams(filters: InstitutionCertFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  return params;
}

export function getInstitutionCompanyInfos(filters: InstitutionCertFilters) {
  const params = buildParams(filters);
  return apiClient<InstitutionCertPage<AdminInstitutionCompanyInfo>>(
    `/institutions/company-info?${params.toString()}`
  );
}

export function approveInstitution(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/institutions/company-info/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectInstitution(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/institutions/company-info/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
