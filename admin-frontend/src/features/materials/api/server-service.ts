import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildMaterialParams } from './service';
import type { MaterialFilters, MaterialsResponse } from './types';

/** 服务端预取：素材列表 */
export async function getMaterialsFromServer(
  filters: MaterialFilters
): Promise<MaterialsResponse> {
  const params = buildMaterialParams(filters);
  return serverFetch(
    `/admin/materials?${params.toString()}`
  ) as Promise<MaterialsResponse>;
}
