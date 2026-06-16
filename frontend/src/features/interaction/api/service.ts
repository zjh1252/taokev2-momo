import { apiGet, apiPost, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageData,
  InteractionState,
  FavoriteItem,
  ReviewItem,
  SubmitReviewPayload,
  SubmitTrainerMessagePayload,
} from './types';

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/* ==================== 互动聚合状态 ==================== */

export async function getInteractionState(
  targetType: string,
  targetId: number,
): Promise<InteractionState> {
  const res = await apiGet<ApiResponse<InteractionState>>(
    `/interaction/states?targetType=${targetType}&targetId=${targetId}`,
    { headers: authHeaders(), silent: true },
  );
  return res.data;
}

/* ==================== 收藏 ==================== */

export async function addFavorite(targetType: string, targetId: number): Promise<void> {
  await apiPost<ApiResponse<void>>('/interaction/favorites', { targetType, targetId }, {
    headers: authHeaders(),
  });
}

export async function removeFavorite(targetType: string, targetId: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    `/interaction/favorites?targetType=${targetType}&targetId=${targetId}`,
    { headers: authHeaders() },
  );
}

export async function getFavorites(
  page = 0,
  size = 10,
  targetType?: string,
): Promise<PageData<FavoriteItem>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (targetType) params.set('targetType', targetType);
  const res = await apiGet<ApiResponse<PageData<FavoriteItem>>>(
    `/interaction/favorites?${params}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/* ==================== 点赞 ==================== */

export async function addLike(targetType: string, targetId: number): Promise<void> {
  await apiPost<ApiResponse<void>>('/interaction/likes', { targetType, targetId }, {
    headers: authHeaders(),
  });
}

export async function removeLike(targetType: string, targetId: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    `/interaction/likes?targetType=${targetType}&targetId=${targetId}`,
    { headers: authHeaders() },
  );
}

/* ==================== 评价 ==================== */

export async function submitReview(payload: SubmitReviewPayload): Promise<number> {
  const res = await apiPost<ApiResponse<number>>('/interaction/reviews', payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function getPublicReviews(
  scope: string,
  opts: {
    courseId?: number;
    trainerUserId?: number;
    institutionId?: number;
    caseId?: number;
    page?: number;
    size?: number;
  },
): Promise<PageData<ReviewItem>> {
  const params = new URLSearchParams({ scope });
  if (opts.courseId) params.set('courseId', String(opts.courseId));
  if (opts.trainerUserId) params.set('trainerUserId', String(opts.trainerUserId));
  if (opts.institutionId) params.set('institutionId', String(opts.institutionId));
  if (opts.caseId) params.set('caseId', String(opts.caseId));
  params.set('page', String(opts.page ?? 0));
  params.set('size', String(opts.size ?? 10));
  const res = await apiGet<ApiResponse<PageData<ReviewItem>>>(
    `/interaction/reviews?${params}`,
  );
  return res.data;
}

export async function getMyReviews(
  page = 0,
  size = 10,
): Promise<PageData<ReviewItem>> {
  const res = await apiGet<ApiResponse<PageData<ReviewItem>>>(
    `/interaction/reviews/mine?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/* ==================== 专家留言 ==================== */

export async function submitTrainerMessage(
  payload: SubmitTrainerMessagePayload,
): Promise<number> {
  const res = await apiPost<ApiResponse<number>>('/interaction/trainer-messages', payload, {
    headers: authHeaders(),
  });
  return res.data;
}
