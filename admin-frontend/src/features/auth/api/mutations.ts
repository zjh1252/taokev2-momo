import { mutationOptions } from '@tanstack/react-query';
import { login, register, sendCode, logout } from './service';
import type { LoginPayload, RegisterPayload, SendCodePayload } from './types';

export const loginMutation = mutationOptions({
  mutationFn: (data: LoginPayload) => login(data)
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
