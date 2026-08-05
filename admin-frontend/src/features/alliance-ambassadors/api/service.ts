import { apiClient } from '@/lib/api-client';
import type {
  AllianceAmbassadorApplicationDetailResponse,
  AllianceAmbassadorApplicationFilters,
  AllianceAmbassadorApplicationsResponse
} from './types';

export function buildAllianceAmbassadorApplicationParams(
  filters: AllianceAmbassadorApplicationFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getAllianceAmbassadorApplications(
  filters: AllianceAmbassadorApplicationFilters
): Promise<AllianceAmbassadorApplicationsResponse> {
  const params = buildAllianceAmbassadorApplicationParams(filters);
  return apiClient<AllianceAmbassadorApplicationsResponse>(
    `/alliance/ambassadors/applications?${params.toString()}`
  );
}

export async function getAllianceAmbassadorApplicationDetail(
  id: number
): Promise<AllianceAmbassadorApplicationDetailResponse> {
  return apiClient<AllianceAmbassadorApplicationDetailResponse>(
    `/alliance/ambassadors/applications/${id}`
  );
}

export async function approveAllianceAmbassadorApplication(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/alliance/ambassadors/applications/${id}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectAllianceAmbassadorApplication(
  id: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/alliance/ambassadors/applications/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
