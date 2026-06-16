import { apiClient } from '@/lib/api-client';
import type {
  AddRecommendationPayload,
  RecommendationSlotsResponse,
  RecommendationsResponse,
  ReorderRecommendationsPayload,
  UpdateRecommendationPayload
} from './types';

export async function getRecommendationSlots(resourceType?: string) {
  const params = new URLSearchParams();
  if (resourceType) params.set('resourceType', resourceType);
  const qs = params.toString();
  return apiClient<RecommendationSlotsResponse>(
    `/recommendations/slots${qs ? `?${qs}` : ''}`
  );
}

export async function getRecommendations(slotCode: string, categoryId?: number) {
  const params = new URLSearchParams({ slotCode });
  if (categoryId) params.set('categoryId', String(categoryId));
  return apiClient<RecommendationsResponse>(`/recommendations?${params.toString()}`);
}

export async function addRecommendation(payload: AddRecommendationPayload) {
  return apiClient<{ code: number; message: string; data: import('./types').RecommendedResourceItem }>(
    '/recommendations',
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export async function updateRecommendation(id: number, payload: UpdateRecommendationPayload) {
  return apiClient<{ code: number; message: string; data: import('./types').RecommendedResourceItem }>(
    `/recommendations/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
}

export async function removeRecommendation(id: number) {
  return apiClient<{ code: number; message: string }>(`/recommendations/${id}`, {
    method: 'DELETE'
  });
}

export async function reorderRecommendations(payload: ReorderRecommendationsPayload) {
  return apiClient<{ code: number; message: string }>('/recommendations/reorder', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
