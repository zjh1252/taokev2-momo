'use client';

import { useRecordDetailView } from '@/hooks/use-record-detail-view';
import type { ListViewResourceType } from '@/lib/list-view-count';

interface DetailViewRecorderProps {
  resourceType: ListViewResourceType;
  resourceId: number;
  viewCount: number;
}

/** 详情页埋点：进入页面即浏览量 +1，列表返回后依赖 localStorage 展示缓存值 */
export function DetailViewRecorder({
  resourceType,
  resourceId,
  viewCount,
}: DetailViewRecorderProps) {
  useRecordDetailView(resourceType, resourceId, viewCount);
  return null;
}
