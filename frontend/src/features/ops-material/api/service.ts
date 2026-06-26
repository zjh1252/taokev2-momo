import { apiGet, apiPost } from '@/lib/http/client';
import type { ApiResponse, PageResponse } from '@/features/course/api/types';
import type {
  OpsMaterialItem,
  OpsMaterialListParams,
  OpsMaterialListResponse
} from './types';

export async function listOpsMaterials(
  params: OpsMaterialListParams
): Promise<OpsMaterialListResponse> {
  const search = new URLSearchParams();
  search.set('materialType', params.materialType);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 40));
  if (params.category) search.set('category', params.category);
  if (params.scene) search.set('scene', params.scene);

  const resp = await apiGet<ApiResponse<PageResponse<OpsMaterialItem>>>(
    `/materials?${search.toString()}`
  );
  return {
    list: resp.data.list,
    total: resp.data.total,
    page: resp.data.page,
    size: resp.data.size
  };
}

/** 用户手动选用素材时累加使用次数 */
export async function pickOpsMaterial(id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/materials/${id}/pick`, undefined, {
    silent: true
  });
}
