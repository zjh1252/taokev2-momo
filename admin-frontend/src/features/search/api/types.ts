/** 搜索管理模块 — 类型定义 */

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ReindexResult {
  docTypes: string[];
  message: string;
  targetIndex: string;
  indexedCounts: Record<string, number>;
}

export interface SearchIndexInfo {
  name: string;
  defaultIndex: boolean;
  documentCount: number;
}

export interface SearchManagementOverview {
  defaultIndex: string;
  indices: SearchIndexInfo[];
  docTypes: string[];
}
