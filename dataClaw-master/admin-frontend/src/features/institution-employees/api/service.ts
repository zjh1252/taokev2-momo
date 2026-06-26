import { apiClient } from '@/lib/api-client';
import type {
  InstitutionEmployeeFilters,
  InstitutionEmployeesResponse,
  InstitutionEmployeeApplicationsResponse
} from './types';

export function buildInstEmployeeParams(
  filters: InstitutionEmployeeFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getInstitutionEmployees(
  filters: InstitutionEmployeeFilters
): Promise<InstitutionEmployeesResponse> {
  const params = buildInstEmployeeParams(filters);
  return apiClient<InstitutionEmployeesResponse>(
    `/institution-employees?${params.toString()}`
  );
}

export async function getInstitutionEmployeeApplications(
  filters: InstitutionEmployeeFilters
): Promise<InstitutionEmployeeApplicationsResponse> {
  const params = buildInstEmployeeParams(filters);
  return apiClient<InstitutionEmployeeApplicationsResponse>(
    `/institution-employees/applications?${params.toString()}`
  );
}

export async function approveInstEmployeeApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(
    `/institution-employees/applications/${userId}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectInstEmployeeApplication(
  userId: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/institution-employees/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
