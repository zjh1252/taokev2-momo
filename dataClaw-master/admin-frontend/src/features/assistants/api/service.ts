import { apiClient } from '@/lib/api-client';
import type {
  AssistantFilters,
  AssistantsResponse
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
