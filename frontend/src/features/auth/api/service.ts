import { apiPost, apiGet } from '@/lib/http/client';
import type { SendCodePayload, SmsLoginPayload, TokenResponse, ApiResult } from './types';

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
