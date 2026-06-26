import { serverFetch } from '@/lib/server-fetch';
import type { DemandFilters, DemandsResponse } from './types';
import { buildDemandParams } from './service';

/** 服务端：需求列表（用于 prefetch） */
export async function getDemandsFromServer(
  filters: DemandFilters
): Promise<DemandsResponse> {
  const params = buildDemandParams(filters);
  return serverFetch<DemandsResponse['data']>(
    `/admin/demands?${params.toString()}`
  ) as Promise<DemandsResponse>;
}
