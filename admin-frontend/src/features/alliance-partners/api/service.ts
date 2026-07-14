import { apiClient } from '@/lib/api-client';
import type {
  AlliancePartnerApplicationDetailResponse,
  AlliancePartnerApplicationFilters,
  AlliancePartnerApplicationsResponse
} from './types';

export function buildAlliancePartnerApplicationParams(
  filters: AlliancePartnerApplicationFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getAlliancePartnerApplications(
  filters: AlliancePartnerApplicationFilters
): Promise<AlliancePartnerApplicationsResponse> {
  const params = buildAlliancePartnerApplicationParams(filters);
  return apiClient<AlliancePartnerApplicationsResponse>(
    `/alliance/partners/applications?${params.toString()}`
  );
}

export async function getAlliancePartnerApplicationDetail(
  id: number
): Promise<AlliancePartnerApplicationDetailResponse> {
  return apiClient<AlliancePartnerApplicationDetailResponse>(
    `/alliance/partners/applications/${id}`
  );
}

export async function approveAlliancePartnerApplication(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/alliance/partners/applications/${id}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectAlliancePartnerApplication(
  id: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/alliance/partners/applications/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
