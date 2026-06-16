import { apiGet } from '@/lib/http/client';
import type { ApiResponse } from '@/features/trainer/types';
import type {
  GetPublicRecommendationsOptions,
  PublicRecommendedItem,
  RecommendationSlotCode
} from './types';

/**
 * 按推荐位查询公开推荐资源（无需登录）
 */
export async function getPublicRecommendations(
  slotCode: RecommendationSlotCode,
  options: GetPublicRecommendationsOptions = {}
): Promise<PublicRecommendedItem[]> {
  const query = new URLSearchParams({ slotCode });
  if (options.limit != null) query.set('limit', String(options.limit));
  if (options.categoryId != null) query.set('categoryId', String(options.categoryId));
  if (options.includeBackup) query.set('includeBackup', 'true');

  const res = await apiGet<ApiResponse<PublicRecommendedItem[]>>(
    `/recommendations/public?${query.toString()}`,
    { silent: true }
  );
  return res.data ?? [];
}
