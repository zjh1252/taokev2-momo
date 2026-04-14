import { apiClient } from '@/lib/api-client';
import type {
  AssistantFilters,
  AssistantsResponse,
  AssistantApplicationsResponse
} from './types';

export function buildAssistantParams(
  filters: AssistantFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getAssistants(
  filters: AssistantFilters
): Promise<AssistantsResponse> {
  return apiClient<AssistantsResponse>(
    `/assistants?${buildAssistantParams(filters).toString()}`
  );
}

export async function getAssistantApplications(
  filters: AssistantFilters
): Promise<AssistantApplicationsResponse> {
  return apiClient<AssistantApplicationsResponse>(
    `/assistants/applications?${buildAssistantParams(filters).toString()}`
  );
}

export async function approveAssistantApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(
    `/assistants/applications/${userId}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectAssistantApplication(
  userId: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/assistants/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
