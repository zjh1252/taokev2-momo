'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  currentBrowserSearchParams,
  getBrowserPathname,
  mergeListUrlParams,
  replaceBrowserUrl,
} from '@/lib/sync-list-filter-url';

/**
 * 列表页 keyword 与 URL {@code ?keyword=} 双向同步（配合顶部搜索栏跳转）
 */
export function useListKeywordUrl() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';

  const commitKeyword = useCallback(
    (kw: string) => {
      const params = mergeListUrlParams(
        currentBrowserSearchParams(searchParams),
        { keyword: kw },
        1,
      );
      replaceBrowserUrl(getBrowserPathname(), params);
    },
    [searchParams],
  );

  return { keyword, commitKeyword };
}
