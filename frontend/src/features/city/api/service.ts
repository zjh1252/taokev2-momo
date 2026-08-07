import { apiGet } from '@/lib/http/client';
import type { ApiResponse } from '@/features/trainer/types';
import type { ActiveCityItem, CityChannelDetail, CityChannelHome } from './types';

/**
 * 拉取「有有效公开课」的城市，按课程数倒序。
 * <p>用于首页底部「城市频道」卡片；接口失败时调用方应自行 fallback 到空数组。</p>
 */
export async function getActiveCities(limit = 18): Promise<ActiveCityItem[]> {
  const res = await apiGet<ApiResponse<ActiveCityItem[]>>(`/cities/active?limit=${limit}`, {
    skipAuth: true,
  });
  return res.data ?? [];
}

/**
 * 按拼音解析城市详情，用于 /cities/[pinyin] SSR。
 * <p>直辖市的 {@code cityRegionId} 为省级 region.id（与老库 course_plans / 专家 cityId 一致）。</p>
 */
export async function getCityByEnName(enName: string): Promise<CityChannelDetail | null> {
  const res = await apiGet<ApiResponse<CityChannelDetail | null>>(
    `/cities/${encodeURIComponent(enName)}`,
    { skipAuth: true },
  );
  return res.data ?? null;
}

/**
 * 城市综合页聚合（详情 + 五业务块）。
 * <p>失败或城市不存在时返回 null；调用方负责 notFound / 空态。</p>
 */
export async function getCityHome(enName: string): Promise<CityChannelHome | null> {
  const res = await apiGet<ApiResponse<CityChannelHome | null>>(
    `/cities/${encodeURIComponent(enName)}/home`,
    { skipAuth: true },
  );
  return res.data ?? null;
}
