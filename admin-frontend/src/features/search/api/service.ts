import { apiClient, assertApiOk } from '@/lib/api-client';
import type { ApiResponse, ReindexResult, SearchManagementOverview } from './types';

const REINDEX_TIMEOUT_MS = 10 * 60 * 1000;

/** 获取搜索管理概览 */
export async function getSearchOverview(): Promise<ApiResponse<SearchManagementOverview>> {
  const resp = await apiClient<ApiResponse<SearchManagementOverview>>('/search/overview');
  assertApiOk(resp);
  return resp;
}

/** 获取索引列表 */
export async function getIndices(): Promise<ApiResponse<string[]>> {
  const resp = await apiClient<ApiResponse<string[]>>('/search/indices');
  assertApiOk(resp);
  return resp;
}

/** 创建索引 */
export async function createIndex(indexName?: string): Promise<ApiResponse<boolean>> {
  const resp = await apiClient<ApiResponse<boolean>>('/search/indices', {
    method: 'POST',
    body: JSON.stringify(indexName ? { indexName } : {})
  });
  assertApiOk(resp);
  return resp;
}

/** 删除索引 */
export async function deleteIndex(indexName: string): Promise<ApiResponse<null>> {
  const resp = await apiClient<ApiResponse<null>>(`/search/indices/${indexName}`, {
    method: 'DELETE'
  });
  assertApiOk(resp);
  return resp;
}

/** 更新索引 mapping（用于加新字段） */
export async function putMapping(indexName: string): Promise<ApiResponse<boolean>> {
  const resp = await apiClient<ApiResponse<boolean>>(`/search/indices/${indexName}/mapping`, {
    method: 'PUT'
  });
  assertApiOk(resp);
  return resp;
}

/** 全量重建所有类型 */
export async function reindexAll(targetIndex?: string): Promise<ApiResponse<ReindexResult>> {
  const resp = await apiClient<ApiResponse<ReindexResult>>('/search/reindex', {
    method: 'POST',
    body: JSON.stringify(targetIndex ? { targetIndex } : {}),
    timeoutMs: REINDEX_TIMEOUT_MS
  });
  assertApiOk(resp);
  return resp;
}

/** 按文档类型重建 */
export async function reindexByType(
  docType: string,
  targetIndex?: string
): Promise<ApiResponse<ReindexResult>> {
  const resp = await apiClient<ApiResponse<ReindexResult>>(`/search/reindex/${docType}`, {
    method: 'POST',
    body: JSON.stringify(targetIndex ? { targetIndex } : {}),
    timeoutMs: REINDEX_TIMEOUT_MS
  });
  assertApiOk(resp);
  return resp;
}
