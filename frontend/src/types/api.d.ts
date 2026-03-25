// 通用 API 响应结构（与后端 ApiResponse 对齐）

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

interface PageResponse<T = unknown> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
