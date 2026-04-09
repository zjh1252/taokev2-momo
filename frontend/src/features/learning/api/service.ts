import { apiGet } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageResponse,
  MyVideoLearning,
  MyCourseEnrollment,
  ContinueLearning,
} from './types';

function getAccessToken(): string | null {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return tokenData?.accessToken ?? null;
}

function authHeaders() {
  return { Authorization: `Bearer ${getAccessToken() || ''}` };
}

/** 我的录播课列表（含学习进度），未登录返回空分页 */
export async function getMyVideoLearnings(
  page = 1,
  size = 10,
): Promise<PageResponse<MyVideoLearning>> {
  if (!getAccessToken()) return { list: [], total: 0, page, size, totalPages: 0 };
  const res = await apiGet<ApiResponse<PageResponse<MyVideoLearning>>>(
    `/learning/videos?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 我的公开课报名列表，未登录返回空分页 */
export async function getMyCourseEnrollments(
  page = 1,
  size = 10,
): Promise<PageResponse<MyCourseEnrollment>> {
  if (!getAccessToken()) return { list: [], total: 0, page, size, totalPages: 0 };
  const res = await apiGet<ApiResponse<PageResponse<MyCourseEnrollment>>>(
    `/learning/courses?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 继续学习（最近未完成录播课），未登录返回 null */
export async function getContinueLearning(): Promise<ContinueLearning | null> {
  if (!getAccessToken()) return null;
  const res = await apiGet<ApiResponse<ContinueLearning | null>>(
    '/learning/continue',
    { headers: authHeaders() },
  );
  return res.data;
}
