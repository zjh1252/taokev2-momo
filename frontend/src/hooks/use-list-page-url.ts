'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { parseListPageFromSearchParams } from '@/lib/list-page';

type UseListPageUrlSyncOptions = {
  currentPage: number;
  /** URL 页码与本地不一致时（含浏览器后退）触发拉数 */
  onPageFromUrl: (page: number) => void;
};

/**
 * 列表分页与 URL {@code ?page=} 同步，浏览器从详情页返回时可回到原页码。
 */
export function useListPageUrlSync({ currentPage, onPageFromUrl }: UseListPageUrlSyncOptions) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pageFromUrl = parseListPageFromSearchParams(searchParams);
  const skipNextSyncRef = useRef(false);
  const onPageFromUrlRef = useRef(onPageFromUrl);
  onPageFromUrlRef.current = onPageFromUrl;

  const writePageToUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(page));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  /** 用户主动翻页：写 URL，并跳过一次由 URL 触发的重复拉数 */
  const commitPageChange = useCallback(
    (page: number) => {
      skipNextSyncRef.current = true;
      writePageToUrl(page);
    },
    [writePageToUrl],
  );

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    if (pageFromUrl !== currentPage) {
      onPageFromUrlRef.current(pageFromUrl);
    }
  }, [pageFromUrl, currentPage]);

  return { commitPageChange };
}
