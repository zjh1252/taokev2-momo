import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const VIEW_COUNT_CACHE_KEY = 'tk:list-view-count:v1';

export type ListViewResourceType = 'trainer' | 'course' | 'video' | 'institution';

/** 复用已有详情 GET 路由，通过 bumpView=1 仅递增浏览量（避免依赖未部署的 POST /view） */
const ENDPOINTS: Record<ListViewResourceType, (id: number) => string> = {
  trainer: (id) => `/trainers/${id}?bumpView=1`,
  course: (id) => `/courses/${id}?bumpView=1`,
  video: (id) => `/videos/${id}?bumpView=1`,
  institution: (id) => `/institutions/${id}?bumpView=1`,
};

function cacheKey(type: ListViewResourceType, id: number) {
  return `${type}:${id}`;
}

function readCache(): Record<string, number> {
  return storage.get<Record<string, number>>(VIEW_COUNT_CACHE_KEY) ?? {};
}

/** 读取本地已记录的最高浏览量（返回上一页 / 刷新后仍展示点击后的值） */
export function getCachedListViewCount(
  type: ListViewResourceType,
  id: number,
): number | null {
  const value = readCache()[cacheKey(type, id)];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** 写入本地最高浏览量，仅在新值更大时更新 */
export function setCachedListViewCount(
  type: ListViewResourceType,
  id: number,
  count: number,
) {
  if (id <= 0 || !Number.isFinite(count)) return;
  const cache = readCache();
  const key = cacheKey(type, id);
  const prev = cache[key];
  if (prev != null && prev >= count) return;
  cache[key] = count;
  storage.set(VIEW_COUNT_CACHE_KEY, cache);
}

/** 服务端直接使用 initial 值，不做 localStorage 合并（避免 hydration 不匹配） */
export function resolveListViewCount(
  type: ListViewResourceType,
  id: number,
  initial: number,
): number {
  // SSR 阶段 storage 返回 null，直接返回 initial
  // CSR 阶段由 useBumpedViewCount 的 useEffect 做 Math.max 对齐
  return Number.isFinite(initial) ? initial : 0;
}

/**
 * 列表卡片点击时上报浏览量（GET bumpView=1，keepalive，不阻塞跳转）
 */
export function recordListViewCount(type: ListViewResourceType, id: number) {
  if (typeof window === 'undefined' || id <= 0) return;

  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (tokenData?.accessToken) {
    headers.Authorization = `Bearer ${tokenData.accessToken}`;
  }

  const url = `${API_BASE_URL}${ENDPOINTS[type](id)}`;
  void fetch(url, {
    method: 'GET',
    keepalive: true,
    headers,
  }).catch(() => {});
}
