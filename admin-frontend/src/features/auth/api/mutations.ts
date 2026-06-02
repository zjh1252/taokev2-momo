import { mutationOptions } from '@tanstack/react-query';
import { login, register, sendCode, logout } from './service';
import type { LoginPayload, RegisterPayload, SendCodePayload } from './types';
import { withCaptcha } from '@/lib/captcha';

export const loginMutation = mutationOptions({
  // 后台登录始终需滑块：先尝试，后端返回 CAPTCHA_REQUIRED 时弹滑块拿 token 重试
  mutationFn: (data: LoginPayload) => withCaptcha((captchaToken) => login({ ...data, captchaToken }))
});

export const registerMutation = mutationOptions({
  mutationFn: (data: RegisterPayload) => register(data)
});

export const sendCodeMutation = mutationOptions({
  mutationFn: (data: SendCodePayload) => sendCode(data)
});

export const logoutMutation = mutationOptions({
  mutationFn: () => logout()
});
