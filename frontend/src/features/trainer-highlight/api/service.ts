import { apiGet, apiPost, apiPut, apiDelete, authHeaders } from '@/lib/http/client';
import type {
  ApiResponse,
  TrainerHighlight,
  TrainerHighlightFile,
  SaveTrainerHighlightRequest,
  SaveTrainerHighlightFileRequest
} from './types';

/**
 * 专家精彩瞬间 API
 */

/** C 端：某专家已通过的精彩瞬间 */
export async function getTrainerHighlights(trainerId: number): Promise<TrainerHighlight[]> {
  const res = await apiGet<ApiResponse<TrainerHighlight[]>>(`/trainers/${trainerId}/highlights`);
  return res.data ?? [];
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

/** 保存精彩瞬间草稿（不进入审核，允许信息不完整） */
export async function createHighlightDraft(
  data: SaveTrainerHighlightRequest,
  trainerUserId?: number,
): Promise<TrainerHighlight> {
  const res = await apiPost<ApiResponse<TrainerHighlight>>(
    `/trainers/me/highlights/draft${buildQs(trainerUserId)}`,
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

/** 保存精彩瞬间草稿（编辑，不进入审核，允许信息不完整） */
export async function updateHighlightDraft(
  id: number,
  data: SaveTrainerHighlightRequest,
  trainerUserId?: number,
): Promise<TrainerHighlight> {
  const res = await apiPut<ApiResponse<TrainerHighlight>>(
    `/trainers/me/highlights/${id}/draft${buildQs(trainerUserId)}`,
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
