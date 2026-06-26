import { serverFetch } from '@/lib/server-fetch';
import type { RecommendationSlotsResponse, RecommendationsResponse } from './types';

export async function getRecommendationsFromServer(slotCode: string, categoryId?: number) {
  const params = new URLSearchParams({ slotCode });
  if (categoryId) params.set('categoryId', String(categoryId));
  return serverFetch<RecommendationsResponse['data']>(
    `/admin/recommendations?${params.toString()}`
  ) as Promise<RecommendationsResponse>;
}

export async function getRecommendationSlotsFromServer(resourceType?: string) {
  const params = new URLSearchParams();
  if (resourceType) params.set('resourceType', resourceType);
  const qs = params.toString();
  return serverFetch<RecommendationSlotsResponse['data']>(
    `/admin/recommendations/slots${qs ? `?${qs}` : ''}`
  ) as Promise<RecommendationSlotsResponse>;
}
