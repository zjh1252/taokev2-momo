import { apiGet, apiPut } from '@/lib/http/client';
import type { ApiResult, UserProfileResponse } from '@/features/user/api/types';

/**
 * 修改密码
 */
export function changePassword(
  token: string,
  data: { oldPassword?: string; newPassword: string },
) {
  return apiPut<ApiResult>('/users/me/password', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 获取未读通知数
 */
export function getUnreadCount(token: string) {
  return apiGet<ApiResult<number>>('/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 分页查询我的通知
 */
export function getNotifications(token: string, page = 1, size = 20) {
  return apiGet<ApiResult<NotificationPageResponse>>(
    `/notifications?page=${page}&size=${size}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

/**
 * 标记单条通知为已读
 */
export function markNotificationRead(token: string, id: number) {
  return apiPut<ApiResult>(`/notifications/${id}/read`, undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 标记全部通知为已读
 */
export function markAllNotificationsRead(token: string) {
  return apiPut<ApiResult>('/notifications/read-all', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 更新用户资料
 */
export function updateProfile(
  token: string,
  data: { nickname?: string; avatarUrl?: string; gender?: number },
) {
  return apiPut<ApiResult>('/users/me', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---- 类型 ----

export interface NotificationItem {
  id: number;
  type: string;
  typeLabel: string;
  title: string;
  content: string;
  relatedId: string | null;
  relatedUrl: string | null;
  isRead: number;
  createdAt: string;
}

export interface NotificationPageResponse {
  list: NotificationItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
