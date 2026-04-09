import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  InstitutionFilters,
  InstitutionsResponse,
  InstitutionApplicationsResponse
} from './types';
import { buildInstitutionParams } from './service';

/** 服务端预取：机构列表 */
export async function getInstitutionsFromServer(
  filters: InstitutionFilters
): Promise<InstitutionsResponse> {
  const params = buildInstitutionParams(filters);
  return serverFetch(
    `/admin/institutions?${params.toString()}`
  ) as Promise<InstitutionsResponse>;
}

/** 服务端预取：机构申请列表 */
export async function getInstitutionApplicationsFromServer(
  filters: InstitutionFilters
): Promise<InstitutionApplicationsResponse> {
  const params = buildInstitutionParams(filters);
  return serverFetch(
    `/admin/institutions/applications?${params.toString()}`
  ) as Promise<InstitutionApplicationsResponse>;
}
