import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildAllianceLecturer721ApplicationParams } from './service';
import type {
  AllianceLecturer721ApplicationFilters,
  AllianceLecturer721ApplicationsResponse
} from './types';

export async function getAllianceLecturer721ApplicationsFromServer(
  filters: AllianceLecturer721ApplicationFilters
): Promise<AllianceLecturer721ApplicationsResponse> {
  const params = buildAllianceLecturer721ApplicationParams(filters);
  return serverFetch<AllianceLecturer721ApplicationsResponse['data']>(
    `/admin/alliance/lecturers721/applications?${params.toString()}`
  );
}
