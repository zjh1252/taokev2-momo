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
