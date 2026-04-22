import { apiClient } from '@/lib/api-client';
import type { TrainingReviewFilters, TrainingReviewsResponse } from './types';

export function buildTrainingReviewParams(
  filters: TrainingReviewFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.reviewScope) params.set('reviewScope', filters.reviewScope);
  return params;
}

export async function getTrainingReviews(
  filters: TrainingReviewFilters
): Promise<TrainingReviewsResponse> {
  const params = buildTrainingReviewParams(filters);
  return apiClient<TrainingReviewsResponse>(
    `/training-reviews?${params.toString()}`
  );
}

export async function approveTrainingReview(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/training-reviews/${id}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectTrainingReview(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/training-reviews/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

export async function hideTrainingReview(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/training-reviews/${id}/hide`,
    { method: 'PUT' }
  );
}
