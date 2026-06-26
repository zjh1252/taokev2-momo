import { apiGet } from '@/lib/http/client';
import type { UserProfileResponse, ApiResult } from './types';

/**
 * 获取当前登录用户个人资料
 * GET /users/me（需要 Authorization header）
 * <p>silent 模式：token 过期时不弹 toast，由 AuthProvider 静默处理</p>
 */
export function getMyProfile(accessToken: string) {
  return apiGet<ApiResult<UserProfileResponse>>('/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    silent: true,
  });
}
