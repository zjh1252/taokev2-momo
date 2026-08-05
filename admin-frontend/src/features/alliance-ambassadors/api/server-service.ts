import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildAllianceAmbassadorApplicationParams } from './service';
import type {
  AllianceAmbassadorApplicationFilters,
  AllianceAmbassadorApplicationsResponse
} from './types';

export async function getAllianceAmbassadorApplicationsFromServer(
  filters: AllianceAmbassadorApplicationFilters
): Promise<AllianceAmbassadorApplicationsResponse> {
  const params = buildAllianceAmbassadorApplicationParams(filters);
  return serverFetch<AllianceAmbassadorApplicationsResponse['data']>(
    `/admin/alliance/ambassadors/applications?${params.toString()}`
  );
}
