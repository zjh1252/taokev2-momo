'use client';

import { useEffect, useRef } from 'react';
import { recordDetailViewCount, type ListViewResourceType } from '@/lib/list-view-count';

/**
 * 详情页进入时上报浏览量 +1（React Strict Mode 下仅上报一次）
 */
export function useRecordDetailView(
  resourceType: ListViewResourceType,
  resourceId: number,
  serverViewCount: number,
) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current || resourceId <= 0) return;
    recordedRef.current = true;
    recordDetailViewCount(resourceType, resourceId, serverViewCount);
  }, [resourceId, resourceType, serverViewCount]);
}
