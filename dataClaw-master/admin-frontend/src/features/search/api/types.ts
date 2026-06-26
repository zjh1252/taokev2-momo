/** 搜索管理模块 — 类型定义 */

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ReindexResult {
  docTypes: string[];
  message: string;
}
