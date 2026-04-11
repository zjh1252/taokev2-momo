import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  TrainerHighlight,
  SaveTrainerHighlightRequest
} from './types';

/**
 * 专家精彩瞬间 API — 自服务接口（需登录）
 *
 * @author Fangxinxin
 * @date 2026-04-11 18:00
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/** 我的精彩瞬间列表 */
export async function getMyHighlights(): Promise<TrainerHighlight[]> {
  const res = await apiGet<ApiResponse<TrainerHighlight[]>>(
    '/trainers/me/highlights',
    { headers: authHeaders() }
  );
  return res.data;
}

/** 创建精彩瞬间 */
export async function createHighlight(
  data: SaveTrainerHighlightRequest
): Promise<TrainerHighlight> {
  const res = await apiPost<ApiResponse<TrainerHighlight>>(
    '/trainers/me/highlights',
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 编辑精彩瞬间 */
export async function updateHighlight(
  id: number,
  data: SaveTrainerHighlightRequest
): Promise<TrainerHighlight> {
  const res = await apiPut<ApiResponse<TrainerHighlight>>(
    `/trainers/me/highlights/${id}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除精彩瞬间 */
export async function deleteHighlight(id: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/trainers/me/highlights/${id}`, {
    headers: authHeaders()
  });
}
