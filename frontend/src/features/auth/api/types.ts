/** 发送验证码请求 */
export interface SendCodePayload {
  target: string;
  type: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';
  sendType: 'SMS';
}

/** 短信登录请求 */
export interface SmsLoginPayload {
  phone: string;
  code: string;
}

/** 账号 + 密码登录请求 */
export interface UsernameLoginPayload {
  username: string;
  password: string;
}

/** 账号 + 密码注册请求 */
export interface UsernameRegisterPayload {
  username: string;
  password: string;
  nickname?: string;
}

/** 手机号 + 验证码 + 密码注册请求 */
export interface RegisterPayload {
  phone: string;
  code: string;
  password: string;
  nickname?: string;
}

/** 登录/刷新 Token 响应 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  /** 是否为首次登录（新注册用户），后端不返回时为 undefined */
  newUser?: boolean;
}

/** 通用 API 响应包装 */
export interface ApiResult<T = unknown> {
  code: string;
  message: string;
  data: T;
}
