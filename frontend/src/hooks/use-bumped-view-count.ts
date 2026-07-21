'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCachedListViewCount,
  optimisticBumpListViewCount,
  resolveClientListViewCount,
  resolveListViewCount,
  type ListViewResourceType,
} from '@/lib/list-view-count';

export function useBumpedViewCount(
  initial: number,
  resourceType: ListViewResourceType,
  resourceId: number,
) {
  const [viewCount, setViewCount] = useState(() =>
    resolveListViewCount(resourceType, resourceId, initial),
  );

  const syncFromCache = useCallback(() => {
    setViewCount((current) =>
      Math.max(current, resolveClientListViewCount(resourceType, resourceId, initial)),
    );
  }, [initial, resourceType, resourceId]);

  // hydration 后与本地缓存对齐（分页/筛选/返回列表页）
  useEffect(() => {
    syncFromCache();
  }, [syncFromCache]);

  // 浏览器「返回」恢复页面（bfcache）时重新读取本地缓存
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        syncFromCache();
        return;
      }
      // 非 bfcache 返回时，若缓存已更新也同步一次
      if (getCachedListViewCount(resourceType, resourceId) != null) {
        syncFromCache();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [resourceId, resourceType, syncFromCache]);

  const onCardClick = useCallback(() => {
    setViewCount((current) => {
      const next = optimisticBumpListViewCount(resourceType, resourceId, current);
      return next;
    });
  }, [resourceType, resourceId]);

  return { viewCount, onCardClick };
}
