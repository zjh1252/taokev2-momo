import { apiPost, apiGet } from '@/lib/http/client';
import type {
  SendCodePayload,
  SmsLoginPayload,
  TokenResponse,
  ApiResult,
  UsernameLoginPayload,
  UsernameRegisterPayload,
} from './types';

/**
 * 发送短信验证码
 * POST /auth/send-code
 */
export function sendCode(phone: string) {
  const payload: SendCodePayload = {
    target: phone,
    type: 'LOGIN',
    sendType: 'SMS',
  };
  return apiPost<ApiResult>('/auth/send-code', payload);
}

/**
 * 手机号 + 验证码登录（未注册自动注册）
 * POST /auth/login/sms
 */
export function smsLogin(phone: string, code: string) {
  const payload: SmsLoginPayload = { phone, code };
  return apiPost<ApiResult<TokenResponse>>('/auth/login/sms', payload);
}

/**
 * 获取 Mock 验证码（仅开发环境使用）
 * GET /auth/mock/code?phone=xxx
 */
export function getMockCode(phone: string) {
  return apiGet<ApiResult<string>>(`/auth/mock/code?phone=${encodeURIComponent(phone)}`);
}

/**
 * 账号 + 密码登录
 * POST /auth/login/username
 */
export function usernameLogin(payload: UsernameLoginPayload) {
  return apiPost<ApiResult<TokenResponse>>('/auth/login/username', payload);
}

/**
 * 账号 + 密码注册
 * POST /auth/register/username
 */
export function usernameRegister(payload: UsernameRegisterPayload) {
  return apiPost<ApiResult<TokenResponse>>('/auth/register/username', payload);
}

/**
 * 账号可用性预检
 * GET /auth/username/available?username=xxx
 */
export function checkUsernameAvailable(username: string) {
  return apiGet<ApiResult<boolean>>(
    `/auth/username/available?username=${encodeURIComponent(username)}`,
  );
}
