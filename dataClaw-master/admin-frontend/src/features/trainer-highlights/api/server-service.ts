import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  TrainerHighlightFilters,
  TrainerHighlightsResponse
} from './types';
import { buildHighlightParams } from './service';

/** 服务端预取：精彩瞬间列表 */
export async function getTrainerHighlightsFromServer(
  filters: TrainerHighlightFilters
): Promise<TrainerHighlightsResponse> {
  const params = buildHighlightParams(filters);
  return serverFetch(
    `/admin/trainer-highlights?${params.toString()}`
  ) as Promise<TrainerHighlightsResponse>;
}
