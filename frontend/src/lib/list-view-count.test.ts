import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCachedListViewCount,
  optimisticBumpListViewCount,
  recordDetailViewCount,
  resolveClientListViewCount,
  resolveListViewCount,
  setCachedListViewCount,
} from './list-view-count';

const storage = vi.hoisted(() => {
  const map = new Map<string, string>();
  return {
    get<T>(key: string): T | null {
      const value = map.get(key);
      return value ? (JSON.parse(value) as T) : null;
    },
    set(key: string, value: unknown) {
      map.set(key, JSON.stringify(value));
    },
    clear() {
      map.clear();
    },
  };
});

vi.mock('@/lib/storage', () => ({
  storage,
}));

vi.mock('@/lib/auth/constants', () => ({
  TOKEN_KEY: 'tk:token',
}));

describe('list-view-count', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('resolveListViewCount 首屏仅返回服务端 initial', () => {
    setCachedListViewCount('trainer', 1, 999);
    expect(resolveListViewCount('trainer', 1, 100)).toBe(100);
  });

  it('resolveClientListViewCount 与服务端及缓存取较大值', () => {
    setCachedListViewCount('course', 2, 105);
    expect(resolveClientListViewCount('course', 2, 100)).toBe(105);
  });

  it('optimisticBumpListViewCount 列表点击乐观 +1', () => {
    const next = optimisticBumpListViewCount('trainer', 3, 100);
    expect(next).toBe(101);
    expect(getCachedListViewCount('trainer', 3)).toBe(101);
  });

  it('recordDetailViewCount 详情进入 +1 且不与列表乐观重复累加', () => {
    optimisticBumpListViewCount('course', 4, 100);
    recordDetailViewCount('course', 4, 100);
    expect(getCachedListViewCount('course', 4)).toBe(101);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('recordDetailViewCount 直达详情页时写入缓存', () => {
    recordDetailViewCount('institution', 5, 20);
    expect(getCachedListViewCount('institution', 5)).toBe(21);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
