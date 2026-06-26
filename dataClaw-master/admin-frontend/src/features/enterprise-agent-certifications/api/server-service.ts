import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildParams } from './service';
import type {
  EnterpriseAgentCertFilters,
  AdminEnterpriseAgentCert
} from './types';

type Page<T> = { total: number; page: number; size: number; list: T[] };

export async function getEnterpriseAgentCertsFromServer(
  filters: EnterpriseAgentCertFilters
) {
  const params = buildParams(filters);
  return serverFetch<Page<AdminEnterpriseAgentCert>>(
    `/admin/enterprise-agents/certifications/qualification?${params.toString()}`
  );
}
