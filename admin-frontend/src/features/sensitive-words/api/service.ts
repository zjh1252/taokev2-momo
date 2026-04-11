import { apiClient } from '@/lib/api-client';
import type {
  SensitiveWordFilters,
  SensitiveWordsResponse,
  SaveSensitiveWordPayload
} from './types';

export function buildSensitiveWordParams(
  filters: SensitiveWordFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.category !== undefined && filters.category !== null) {
    params.set('category', String(filters.category));
  }
  return params;
}

/** 客户端：敏感词列表 */
export async function getSensitiveWords(
  filters: SensitiveWordFilters
): Promise<SensitiveWordsResponse> {
  const params = buildSensitiveWordParams(filters);
  return apiClient<SensitiveWordsResponse>(
    `/sensitive-words?${params.toString()}`
  );
}

/** 新增敏感词 */
export async function createSensitiveWord(payload: SaveSensitiveWordPayload) {
  return apiClient<{ code: number; message: string; data: unknown }>(
    '/sensitive-words',
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

/** 编辑敏感词 */
export async function updateSensitiveWord(
  id: number,
  payload: SaveSensitiveWordPayload
) {
  return apiClient<{ code: number; message: string; data: unknown }>(
    `/sensitive-words/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
}

/** 删除敏感词 */
export async function deleteSensitiveWord(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/sensitive-words/${id}`,
    { method: 'DELETE' }
  );
}

/** 批量导入（FormData） */
export async function importSensitiveWords(
  file: File,
  category?: number
): Promise<{ code: number; message: string; data: number }> {
  const formData = new FormData();
  formData.append('file', file);
  if (category !== undefined) formData.append('category', String(category));

  const res = await fetch('/api/sensitive-words/import', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('导入失败');
  return res.json();
}

/** 重载词库 */
export async function reloadSensitiveWords() {
  return apiClient<{ code: number; message: string }>(
    '/sensitive-words/reload',
    { method: 'POST' }
  );
}
