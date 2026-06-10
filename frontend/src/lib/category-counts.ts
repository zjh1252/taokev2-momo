import { apiGet } from '@/lib/http/client';
import { serverApiGet } from '@/lib/server-api';
import type { ApiResponse } from '@/features/course/api/types';

/** 将后端 Map 序列化结果（JSON 对象 key 为字符串）转为 number key */
export function parseCategoryCountMap(raw: Record<string, number> | null | undefined): Record<number, number> {
  if (!raw) return {};
  const map: Record<number, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key);
    if (!Number.isNaN(id)) {
      map[id] = value;
    }
  }
  return map;
}

export async function fetchCategoryCountMap(endpoint: string): Promise<Record<number, number>> {
  const res =
    typeof window === 'undefined'
      ? await serverApiGet<ApiResponse<Record<string, number>>>(endpoint)
      : await apiGet<ApiResponse<Record<string, number>>>(endpoint, { silent: true });
  return parseCategoryCountMap(res.data);
}
