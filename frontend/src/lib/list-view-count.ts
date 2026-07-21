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

function normalizeCount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
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

/** SSR / hydration 首屏：仅使用服务端 initial，避免与 localStorage 不一致 */
export function resolveListViewCount(
  _type: ListViewResourceType,
  _id: number,
  initial: number,
): number {
  return normalizeCount(initial);
}

/** CSR 阶段：与服务端 initial 及本地缓存取较大值 */
export function resolveClientListViewCount(
  type: ListViewResourceType,
  id: number,
  initial: number,
): number {
  const base = normalizeCount(initial);
  const cached = getCachedListViewCount(type, id);
  return cached != null ? Math.max(base, cached) : base;
}

/**
 * 列表卡片点击时乐观 +1（仅本地，实际上报在详情页进入时完成）
 */
export function optimisticBumpListViewCount(
  type: ListViewResourceType,
  id: number,
  initial: number,
): number {
  if (typeof window === 'undefined' || id <= 0) {
    return normalizeCount(initial);
  }

  const current = resolveClientListViewCount(type, id, initial);
  const next = current + 1;
  setCachedListViewCount(type, id, next);
  return next;
}

function sendViewCountRequest(type: ListViewResourceType, id: number) {
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

/**
 * 详情页进入时上报浏览量 +1，并同步本地缓存（GET bumpView=1，keepalive）
 */
export function recordDetailViewCount(
  type: ListViewResourceType,
  id: number,
  serverViewCount: number,
) {
  if (typeof window === 'undefined' || id <= 0) return;

  const base = normalizeCount(serverViewCount);
  const cached = getCachedListViewCount(type, id);
  const expectedAfterBump = base + 1;
  const next = Math.max(expectedAfterBump, cached ?? 0);
  setCachedListViewCount(type, id, next);
  sendViewCountRequest(type, id);
}

/** @deprecated 列表点击不再直接上报，保留兼容旧调用 */
export function recordListViewCount(type: ListViewResourceType, id: number) {
  sendViewCountRequest(type, id);
}
