/**
 * 用户自服务 /users/me
 *
 * 通知相关已搬迁至 api/notification.js
 * 文件上传 (/uploads/*) 见 api/upload.js
 */
import http from '@/utils/request';

/** 获取当前用户资料 GET /users/me */
export const getMyProfile = () => http.get('/users/me');

/**
 * 更新当前用户资料 PUT /users/me
 * 后端可接受字段：nickname / realName / avatarUrl / studyTags /
 *                 gender / postCode / provinceId / cityId / districtId / townId / address
 */
export const updateMyProfile = (data) => http.put('/users/me', data);

/** 修改密码 PUT /users/me/password */
export const changePassword = ({ oldPassword, newPassword }) =>
  http.put('/users/me/password', { oldPassword, newPassword });

/**
 * 修改手机号 PUT /users/me/phone
 * 后端 ChangePhoneRequest：oldPhoneCode + newPhone + newPhoneCode
 */
export const changePhone = ({ oldPhoneCode, newPhone, newPhoneCode }) =>
  http.put('/users/me/phone', { oldPhoneCode, newPhone, newPhoneCode });

/** 注销账号 DELETE /users/me */
export const deleteOwnAccount = () => http.del('/users/me');

/** 注销单一身份 DELETE /users/me/roles/{roleCode} */
export const withdrawRole = (roleCode) => http.del(`/users/me/roles/${roleCode}`);
