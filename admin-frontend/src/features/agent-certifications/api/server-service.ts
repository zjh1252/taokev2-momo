import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildRoleCertParams } from './service';
import type { RoleCertFilters, AdminAgentWorkCert } from './types';

type Page<T> = { total: number; page: number; size: number; list: T[] };

export async function getAgentWorkCertsFromServer(filters: RoleCertFilters) {
  const params = buildRoleCertParams(filters);
  return serverFetch<Page<AdminAgentWorkCert>>(
    `/admin/agents/certifications/work-experiences?${params.toString()}`
  );
}
