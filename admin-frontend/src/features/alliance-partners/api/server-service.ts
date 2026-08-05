import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildAlliancePartnerApplicationParams } from './service';
import type {
  AlliancePartnerApplicationFilters,
  AlliancePartnerApplicationsResponse
} from './types';

export async function getAlliancePartnerApplicationsFromServer(
  filters: AlliancePartnerApplicationFilters
): Promise<AlliancePartnerApplicationsResponse> {
  const params = buildAlliancePartnerApplicationParams(filters);
  return serverFetch<AlliancePartnerApplicationsResponse['data']>(
    `/admin/alliance/partners/applications?${params.toString()}`
  );
}
