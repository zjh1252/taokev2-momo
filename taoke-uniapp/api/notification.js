/**
 * 站内通知 / 消息中心
 *
 * ⚠ 注意：通知列表的 page 是 1-based（与收藏 0-based 不同，由后端两套实现导致）
 */
import http from '@/utils/request';

/** 列表 GET /notifications?page=1&size=20 */
export const listNotifications = ({ page = 1, size = 20 } = {}) =>
  http.get('/notifications', { page, size });

/** 未读数 GET /notifications/unread-count */
export const getUnreadCount = () => http.get('/notifications/unread-count');

/** 单条已读 PUT /notifications/{id}/read */
export const markRead = (id) => http.put(`/notifications/${id}/read`);

/** 全部已读 PUT /notifications/read-all */
export const markAllRead = () => http.put('/notifications/read-all');
