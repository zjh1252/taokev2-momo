import http from '@/utils/request';

/** 密码登录 */
export const loginByPassword = ({ account, password }) =>
  http.post('/auth/login', { account, password });

/** 短信验证码登录 */
export const loginBySms = ({ phone, code }) =>
  http.post('/auth/login/sms', { phone, code });

/** 注册 */
export const register = ({ phone, code, password, nickname }) =>
  http.post('/auth/register', { phone, code, password, nickname });

/** 发送验证码（type: register / login / reset） */
export const sendCode = ({ phone, type = 'login' }) =>
  http.post('/auth/send-code', { phone, type });

/** 刷新 token */
export const refreshToken = ({ refreshToken: rt }) =>
  http.post('/auth/refresh', { refreshToken: rt });

/** 重置密码 */
export const resetPassword = ({ phone, code, password }) =>
  http.post('/auth/reset-password', { phone, code, password });
