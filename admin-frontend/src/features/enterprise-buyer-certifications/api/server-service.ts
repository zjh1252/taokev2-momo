import { serverFetch } from '@/lib/server-fetch';
import type { RoleCertFilters, RoleCertPageResponse } from './types';
import type { AdminBuyerRealNameCert, AdminBuyerWorkCert } from './types';
import { buildRoleCertParams } from './service';

export async function getBuyerRealNameCertsFromServer(filters: RoleCertFilters) {
  const params = buildRoleCertParams(filters);
  return serverFetch<RoleCertPageResponse<AdminBuyerRealNameCert>>(
    `/admin/enterprise-buyers/certifications/real-name?${params.toString()}`
  );
}

export async function getBuyerWorkCertsFromServer(filters: RoleCertFilters) {
  const params = buildRoleCertParams(filters);
  return serverFetch<RoleCertPageResponse<AdminBuyerWorkCert>>(
    `/admin/enterprise-buyers/certifications/work-experiences?${params.toString()}`
  );
}
