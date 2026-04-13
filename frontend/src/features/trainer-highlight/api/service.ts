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

/** 添加文件到精彩瞬间 */
export async function addHighlightFile(
  highlightId: number,
  data: SaveTrainerHighlightFileRequest
): Promise<TrainerHighlightFile> {
  const res = await apiPost<ApiResponse<TrainerHighlightFile>>(
    `/trainers/me/highlights/${highlightId}/files`,
    data,
    { headers: authHeaders() }
  );
  return res.data;
}

/** 删除精彩瞬间中的文件 */
export async function deleteHighlightFile(
  highlightId: number,
  fileId: number
): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    `/trainers/me/highlights/${highlightId}/files/${fileId}`,
    { headers: authHeaders() }
  );
}
