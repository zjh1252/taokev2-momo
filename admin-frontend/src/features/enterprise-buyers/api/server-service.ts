import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  EnterpriseBuyerFilters,
  EnterpriseBuyersResponse,
  EnterpriseBuyerApplicationsResponse
} from './types';
import { buildEnterpriseBuyerParams } from './service';

/** 服务端预取：企业采购方列表 */
export async function getEnterpriseBuyersFromServer(
  filters: EnterpriseBuyerFilters
): Promise<EnterpriseBuyersResponse> {
  const params = buildEnterpriseBuyerParams(filters);
  return serverFetch(
    `/admin/enterprise-buyers?${params.toString()}`
  ) as Promise<EnterpriseBuyersResponse>;
}

/** 服务端预取：企业采购方申请列表 */
export async function getEnterpriseBuyerApplicationsFromServer(
  filters: EnterpriseBuyerFilters
): Promise<EnterpriseBuyerApplicationsResponse> {
  const params = buildEnterpriseBuyerParams(filters);
  return serverFetch(
    `/admin/enterprise-buyers/applications?${params.toString()}`
  ) as Promise<EnterpriseBuyerApplicationsResponse>;
}
