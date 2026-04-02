import { apiGet, apiPut } from '@/lib/http/client';
import type { NotificationItem, PageResponse, ApiResult } from './types';

/** 获取未读通知数 */
export function getUnreadCount(token: string) {
  return apiGet<ApiResult<number>>('/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** 分页获取通知列表 */
export function getNotifications(token: string, page = 1, size = 10) {
  return apiGet<ApiResult<PageResponse<NotificationItem>>>(
    `/notifications?page=${page}&size=${size}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

/** 标记单条通知为已读 */
export function markNotificationRead(token: string, id: number) {
  return apiPut<ApiResult<void>>(`/notifications/${id}/read`, undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** 标记全部通知为已读 */
export function markAllNotificationsRead(token: string) {
  return apiPut<ApiResult<void>>('/notifications/read-all', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
