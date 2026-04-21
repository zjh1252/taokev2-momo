import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResponse, TrainerCase, TrainerCaseFile, SaveTrainerCaseRequest } from './types';

/**
 * 专家案例 API — 自服务接口（需登录）
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

function buildQs(trainerUserId?: number) {
  return trainerUserId ? `?trainerUserId=${trainerUserId}` : '';
}

/** 我的案例列表（trainerUserId 提供时表示代管模式） */
export async function getMyCases(trainerUserId?: number): Promise<TrainerCase[]> {
  const res = await apiGet<ApiResponse<TrainerCase[]>>(
    `/trainers/me/cases${buildQs(trainerUserId)}`,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 我的案例详情 */
export async function getMyCaseDetail(id: number, trainerUserId?: number): Promise<TrainerCase> {
  const res = await apiGet<ApiResponse<TrainerCase>>(
    `/trainers/me/cases/${id}${buildQs(trainerUserId)}`,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 创建案例（trainerUserId 提供时以专家身份创建） */
export async function createCase(
  data: SaveTrainerCaseRequest,
  trainerUserId?: number,
): Promise<TrainerCase> {
  const res = await apiPost<ApiResponse<TrainerCase>>(
    `/trainers/me/cases${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 编辑案例 */
export async function updateCase(
  id: number,
  data: SaveTrainerCaseRequest,
  trainerUserId?: number,
): Promise<TrainerCase> {
  const res = await apiPut<ApiResponse<TrainerCase>>(
    `/trainers/me/cases/${id}${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除案例 */
export async function deleteCase(id: number, trainerUserId?: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/trainers/me/cases/${id}${buildQs(trainerUserId)}`, {
    headers: authHeaders()
  });
}

/** 添加案例附件 */
export async function addCaseFile(
  caseId: number,
  data: { fileType: number; title?: string; fileUrl: string; thumbnailUrl?: string; width?: number; height?: number; duration?: number; fileSize?: number; sortOrder?: number },
  trainerUserId?: number,
): Promise<TrainerCaseFile> {
  const res = await apiPost<ApiResponse<TrainerCaseFile>>(
    `/trainers/me/cases/${caseId}/files${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除案例附件 */
export async function deleteCaseFile(
  caseId: number,
  fileId: number,
  trainerUserId?: number,
): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    `/trainers/me/cases/${caseId}/files/${fileId}${buildQs(trainerUserId)}`,
    { headers: authHeaders() }
  );
}
