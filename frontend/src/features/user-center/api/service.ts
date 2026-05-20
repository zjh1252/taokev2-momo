import { apiDelete, apiGet, apiPut } from '@/lib/http/client';
import type { ApiResult, UserProfileResponse } from '@/features/user/api/types';

/**
 * 注销账号（硬删除当前用户全部记录）。
 * <p>服务端会同步删除 sys_users / sys_user_roles / 所有业务子表 / 所有绑定关系；
 * 已上传的 OSS 文件不联动清理。成功后调用方应清掉本地 token 并跳转登录。</p>
 */
export function deleteOwnAccount(token: string) {
  return apiDelete<ApiResult>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 注销单一身份（如 TRAINER / AGENT / ...）。
 * <p>BUYER 角色无法单独注销 — 服务端会返回错误。</p>
 */
export function withdrawRole(token: string, roleCode: string) {
  return apiDelete<ApiResult>(`/users/me/roles/${encodeURIComponent(roleCode)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

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
  data: {
    nickname?: string;
    realName?: string;
    avatarUrl?: string;
    gender?: number;
    studyTags?: string;
  },
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
