import http from '@/utils/request';

/** 获取当前用户资料 */
export const getMyProfile = () => http.get('/users/me');

/** 更新当前用户资料 */
export const updateMyProfile = (data) => http.put('/users/me', data);

/** 修改密码 */
export const changePassword = ({ oldPassword, newPassword }) =>
  http.put('/users/me/password', { oldPassword, newPassword });

/** 修改手机号 */
export const changePhone = ({ newPhone, code }) =>
  http.put('/users/me/phone', { newPhone, code });

/** 通知列表 */
export const listNotifications = (params) => http.get('/notifications', params);

/** 未读数 */
export const getUnreadCount = () => http.get('/notifications/unread-count');

/** 标记已读 */
export const markRead = (id) => http.put(`/notifications/${id}/read`);
