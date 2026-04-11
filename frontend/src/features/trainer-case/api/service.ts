import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResponse, TrainerCase, SaveTrainerCaseRequest } from './types';

/**
 * 专家案例 API — 自服务接口（需登录）
 *
 * @author Fangxinxin
 * @date 2026-04-11 18:00
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/** 我的案例列表 */
export async function getMyCases(): Promise<TrainerCase[]> {
  const res = await apiGet<ApiResponse<TrainerCase[]>>(
    '/trainers/me/cases',
    { headers: authHeaders() }
  );
  return res.data;
}

/** 我的案例详情 */
export async function getMyCaseDetail(id: number): Promise<TrainerCase> {
  const res = await apiGet<ApiResponse<TrainerCase>>(
    `/trainers/me/cases/${id}`,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 创建案例 */
export async function createCase(
  data: SaveTrainerCaseRequest
): Promise<TrainerCase> {
  const res = await apiPost<ApiResponse<TrainerCase>>(
    '/trainers/me/cases',
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 编辑案例 */
export async function updateCase(
  id: number,
  data: SaveTrainerCaseRequest
): Promise<TrainerCase> {
  const res = await apiPut<ApiResponse<TrainerCase>>(
    `/trainers/me/cases/${id}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除案例 */
export async function deleteCase(id: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/trainers/me/cases/${id}`, {
    headers: authHeaders()
  });
}
