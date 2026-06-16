'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  recordListViewCount,
  resolveListViewCount,
  setCachedListViewCount,
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

  // 分页/筛选后服务端数据更新，或与本地缓存对齐
  useEffect(() => {
    setViewCount((current) =>
      Math.max(current, resolveListViewCount(resourceType, resourceId, initial)),
    );
  }, [initial, resourceType, resourceId]);

  // 浏览器「返回」恢复页面（bfcache）时重新读取本地缓存
  useEffect(() => {
    const syncFromCache = () => {
      setViewCount((current) =>
        Math.max(current, resolveListViewCount(resourceType, resourceId, initial)),
      );
    };
    window.addEventListener('pageshow', syncFromCache);
    return () => window.removeEventListener('pageshow', syncFromCache);
  }, [initial, resourceType, resourceId]);

  const onCardClick = useCallback(() => {
    setViewCount((current) => {
      const next = current + 1;
      setCachedListViewCount(resourceType, resourceId, next);
      return next;
    });
    recordListViewCount(resourceType, resourceId);
  }, [resourceType, resourceId]);

  return { viewCount, onCardClick };
}
