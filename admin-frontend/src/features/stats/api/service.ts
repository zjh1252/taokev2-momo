import { apiClient } from '@/lib/api-client';
import type { PendingCountsResponse } from './types';

export async function getPendingCounts(): Promise<PendingCountsResponse> {
  return apiClient<PendingCountsResponse>('/stats/pending-counts');
}
