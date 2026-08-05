import { apiClient } from '@/lib/api-client';
import type {
  AllianceLecturer721ApplicationDetailResponse,
  AllianceLecturer721ApplicationFilters,
  AllianceLecturer721ApplicationsResponse
} from './types';

export function buildAllianceLecturer721ApplicationParams(
  filters: AllianceLecturer721ApplicationFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getAllianceLecturer721Applications(
  filters: AllianceLecturer721ApplicationFilters
): Promise<AllianceLecturer721ApplicationsResponse> {
  const params = buildAllianceLecturer721ApplicationParams(filters);
  return apiClient<AllianceLecturer721ApplicationsResponse>(
    `/alliance/lecturers721/applications?${params.toString()}`
  );
}

export async function getAllianceLecturer721ApplicationDetail(
  id: number
): Promise<AllianceLecturer721ApplicationDetailResponse> {
  return apiClient<AllianceLecturer721ApplicationDetailResponse>(
    `/alliance/lecturers721/applications/${id}`
  );
}

export async function approveAllianceLecturer721Application(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/alliance/lecturers721/applications/${id}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectAllianceLecturer721Application(
  id: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/alliance/lecturers721/applications/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
