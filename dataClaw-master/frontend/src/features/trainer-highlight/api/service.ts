import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  TrainerHighlight,
  TrainerHighlightFile,
  SaveTrainerHighlightRequest,
  SaveTrainerHighlightFileRequest
} from './types';

/**
 * 专家精彩瞬间 API — 自服务接口（需登录）
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

function buildQs(trainerUserId?: number) {
  return trainerUserId ? `?trainerUserId=${trainerUserId}` : '';
}

/** 我的精彩瞬间列表（trainerUserId 提供时表示代管模式） */
export async function getMyHighlights(trainerUserId?: number): Promise<TrainerHighlight[]> {
  const res = await apiGet<ApiResponse<TrainerHighlight[]>>(
    `/trainers/me/highlights${buildQs(trainerUserId)}`,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 创建精彩瞬间（trainerUserId 提供时以专家身份创建） */
export async function createHighlight(
  data: SaveTrainerHighlightRequest,
  trainerUserId?: number,
): Promise<TrainerHighlight> {
  const res = await apiPost<ApiResponse<TrainerHighlight>>(
    `/trainers/me/highlights${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 编辑精彩瞬间 */
export async function updateHighlight(
  id: number,
  data: SaveTrainerHighlightRequest,
  trainerUserId?: number,
): Promise<TrainerHighlight> {
  const res = await apiPut<ApiResponse<TrainerHighlight>>(
    `/trainers/me/highlights/${id}${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除精彩瞬间 */
export async function deleteHighlight(id: number, trainerUserId?: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/trainers/me/highlights/${id}${buildQs(trainerUserId)}`, {
    headers: authHeaders()
  });
}

/** 添加文件到精彩瞬间 */
export async function addHighlightFile(
  highlightId: number,
  data: SaveTrainerHighlightFileRequest,
  trainerUserId?: number,
): Promise<TrainerHighlightFile> {
  const res = await apiPost<ApiResponse<TrainerHighlightFile>>(
    `/trainers/me/highlights/${highlightId}/files${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除精彩瞬间中的文件 */
export async function deleteHighlightFile(
  highlightId: number,
  fileId: number,
  trainerUserId?: number,
): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    `/trainers/me/highlights/${highlightId}/files/${fileId}${buildQs(trainerUserId)}`,
    { headers: authHeaders() }
  );
}
