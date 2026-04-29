import http from '@/utils/request';

/**
 * 账号 + 密码 登录（与 frontend 对齐）
 * 后端：POST /auth/login/username
 *   - username: ^[a-zA-Z0-9_]{4,32}$
 *   - password: 6-32 位
 */
export const loginByUsername = ({ username, password }) =>
  http.post('/auth/login/username', { username, password });

/**
 * 账号 + 密码 注册（与 frontend 对齐）
 * 后端：POST /auth/register/username
 *   - username: ^[a-zA-Z0-9_]{4,32}$
 *   - password: 6-32 位
 *   - nickname: 可选，留空时后端用 username 兜底
 */
export const registerByUsername = ({ username, password, nickname }) =>
  http.post('/auth/register/username', { username, password, nickname });

/** 检查用户名是否可用 GET /auth/username/available?username=xxx */
export const checkUsernameAvailable = (username) =>
  http.get('/auth/username/available', { username });

/**
 * 短信验证码 登录（手机号未注册时后端自动注册）
 * 后端：POST /auth/login/sms
 */
export const loginBySms = ({ phone, code }) =>
  http.post('/auth/login/sms', { phone, code });

/**
 * 发送验证码
 * 后端：POST /auth/send-code
 *   - target: 手机号 / 邮箱
 *   - type:   REGISTER / LOGIN / RESET_PASSWORD / CHANGE_PHONE / CHANGE_EMAIL
 *   - sendType: SMS（默认）/ EMAIL
 */
export const sendCode = ({ target, type = 'LOGIN', sendType = 'SMS' }) =>
  http.post('/auth/send-code', { target, type, sendType });

/**
 * dev 环境：拉取后端为指定手机号生成的 mock 验证码
 * 后端：GET /auth/mock/code?phone=xxx
 * 仅当后端 SmsProvider == MockSmsProvider 时生效（dev profile 默认）
 */
export const getMockCode = (phone) =>
  http.get('/auth/mock/code', { phone });

/** 刷新 token */
export const refreshToken = ({ refreshToken: rt }) =>
  http.post('/auth/refresh', { refreshToken: rt });

/** 重置密码 */
export const resetPassword = ({ phone, code, password }) =>
  http.post('/auth/reset-password', { phone, code, password });

// ================================================================
// 旧接口（保留向下兼容；新业务请使用 loginByUsername / registerByUsername）
// ================================================================

/** @deprecated 请使用 loginByUsername */
export const loginByPassword = ({ account, password }) =>
  http.post('/auth/login', { account, password });

/** @deprecated 旧版手机号 + 验证码注册；新业务用 registerByUsername */
export const register = ({ phone, code, password, nickname }) =>
  http.post('/auth/register', { phone, code, password, nickname });
