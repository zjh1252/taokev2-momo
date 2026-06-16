import { apiClient } from '@/lib/api-client';
import type {
  EnterpriseBuyerFilters,
  EnterpriseBuyersResponse
} from './types';

export function buildEnterpriseBuyerParams(
  filters: EnterpriseBuyerFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** 客户端：企业采购方列表 */
export async function getEnterpriseBuyers(
  filters: EnterpriseBuyerFilters
): Promise<EnterpriseBuyersResponse> {
  const params = buildEnterpriseBuyerParams(filters);
  return apiClient<EnterpriseBuyersResponse>(
    `/enterprise-buyers?${params.toString()}`
  );
}
