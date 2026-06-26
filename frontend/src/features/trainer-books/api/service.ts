import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResponse, TrainerBook, SaveTrainerBookRequest } from './types';

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

function buildQs(trainerUserId?: number) {
  return trainerUserId ? `?trainerUserId=${trainerUserId}` : '';
}

/** 我的著作列表（trainerUserId 提供时表示代管模式） */
export async function getMyBooks(trainerUserId?: number): Promise<TrainerBook[]> {
  const res = await apiGet<ApiResponse<TrainerBook[]>>(
    `/trainers/me/books${buildQs(trainerUserId)}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 创建著作 */
export async function createBook(
  data: SaveTrainerBookRequest,
  trainerUserId?: number,
): Promise<TrainerBook> {
  const res = await apiPost<ApiResponse<TrainerBook>>(
    `/trainers/me/books${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 编辑著作 */
export async function updateBook(
  id: number,
  data: SaveTrainerBookRequest,
  trainerUserId?: number,
): Promise<TrainerBook> {
  const res = await apiPut<ApiResponse<TrainerBook>>(
    `/trainers/me/books/${id}${buildQs(trainerUserId)}`,
    data,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 删除著作 */
export async function deleteBook(id: number, trainerUserId?: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/trainers/me/books/${id}${buildQs(trainerUserId)}`, {
    headers: authHeaders(),
  });
}
