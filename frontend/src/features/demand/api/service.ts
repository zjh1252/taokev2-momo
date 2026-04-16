import { apiGet, apiPost, apiPut } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageResponse,
  DemandListItem,
  DemandDetail,
  CreateDemandRequest,
} from './types';

/**
 * 培训需求 API
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/** 发布需求 */
export async function createDemand(data: CreateDemandRequest): Promise<DemandDetail> {
  const res = await apiPost<ApiResponse<DemandDetail>>(
    '/demands',
    data,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 我的需求列表 */
export async function listMyDemands(
  params: { status?: number; page?: number; size?: number } = {},
): Promise<PageResponse<DemandListItem>> {
  const query = new URLSearchParams();
  if (params.status != null) query.set('status', String(params.status));
  query.set('page', String(params.page || 1));
  query.set('size', String(params.size || 10));

  const res = await apiGet<ApiResponse<PageResponse<DemandListItem>>>(
    `/demands/mine?${query.toString()}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 需求详情 */
export async function getDemandDetail(id: number): Promise<DemandDetail> {
  const res = await apiGet<ApiResponse<DemandDetail>>(
    `/demands/${id}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 取消需求 */
export async function cancelDemand(id: number): Promise<void> {
  await apiPut<ApiResponse<void>>(
    `/demands/${id}/cancel`,
    undefined,
    { headers: authHeaders() },
  );
}
