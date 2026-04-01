import { apiGet } from '@/lib/http/client';
import type { UserProfileResponse, ApiResult } from './types';

/**
 * 获取当前登录用户个人资料
 * GET /users/me（需要 Authorization header）
 */
export function getMyProfile(accessToken: string) {
  return apiGet<ApiResult<UserProfileResponse>>('/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
