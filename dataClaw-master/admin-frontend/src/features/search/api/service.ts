import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ReindexResult } from './types';

/** 获取索引列表 */
export async function getIndices(): Promise<ApiResponse<string[]>> {
  return apiClient<ApiResponse<string[]>>('/search/indices');
}

/** 创建索引 */
export async function createIndex(indexName?: string): Promise<ApiResponse<boolean>> {
  return apiClient<ApiResponse<boolean>>('/search/indices', {
    method: 'POST',
    body: JSON.stringify(indexName ? { indexName } : {})
  });
}

/** 删除索引 */
export async function deleteIndex(indexName: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/search/indices/${indexName}`, {
    method: 'DELETE'
  });
}

/** 全量重建所有类型 */
export async function reindexAll(targetIndex?: string): Promise<ApiResponse<ReindexResult>> {
  return apiClient<ApiResponse<ReindexResult>>('/search/reindex', {
    method: 'POST',
    body: JSON.stringify(targetIndex ? { targetIndex } : {})
  });
}

/** 按文档类型重建 */
export async function reindexByType(
  docType: string,
  targetIndex?: string
): Promise<ApiResponse<ReindexResult>> {
  return apiClient<ApiResponse<ReindexResult>>(`/search/reindex/${docType}`, {
    method: 'POST',
    body: JSON.stringify(targetIndex ? { targetIndex } : {})
  });
}
