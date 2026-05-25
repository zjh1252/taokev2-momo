'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * 列表页 keyword 与 URL {@code ?keyword=} 双向同步（配合顶部搜索栏跳转）
 */
export function useListKeywordUrl() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const keyword = searchParams.get('keyword') ?? '';

  const commitKeyword = useCallback(
    (kw: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = kw.trim();
      if (trimmed) params.set('keyword', trimmed);
      else params.delete('keyword');
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  return { keyword, commitKeyword };
}
