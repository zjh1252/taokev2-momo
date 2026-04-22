import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  EnterpriseBuyerFilters,
  EnterpriseBuyersResponse
} from './types';


/** 服务端预取：企业采购方列表 */
export async function getEnterpriseBuyersFromServer(
  filters: EnterpriseBuyerFilters
): Promise<EnterpriseBuyersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return serverFetch(
    `/admin/enterprise-buyers?${params.toString()}`
  ) as Promise<EnterpriseBuyersResponse>;
}
