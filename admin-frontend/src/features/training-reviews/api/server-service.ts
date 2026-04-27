import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type { TrainingReviewFilters, TrainingReviewsResponse } from './types';

/** 直连后端时使用 {@code size}，与 BFF 的 {@code limit} 不同 */
function buildAdminQuery(filters: TrainingReviewFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.reviewScope) params.set('reviewScope', filters.reviewScope);
  return params;
}

export async function getTrainingReviewsFromServer(
  filters: TrainingReviewFilters
): Promise<TrainingReviewsResponse> {
  const params = buildAdminQuery(filters);
  return serverFetch(
    `/admin/training-reviews?${params.toString()}`
  ) as Promise<TrainingReviewsResponse>;
}
