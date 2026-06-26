export interface NotificationItem {
  id: number;
  type: string;
  typeLabel: string;
  title: string;
  content: string | null;
  relatedId: string | null;
  relatedUrl: string | null;
  isRead: number;
  createdAt: string;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}
