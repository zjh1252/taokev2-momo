'use client';

import { Suspense } from 'react';
import { HeaderNavLinks } from './header-nav-links';
import { UserAuthArea } from './header-auth';
import { SearchBar } from './search-bar';

/**
 * 详情页单行顶栏 — 无 Logo，频道导航 + 收窄搜索 + 精简用户区（无购物车/通知）
 * 相对列表页更矮、字号更小，缩短顶部占用区域。
 */
export function DetailPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100 text-[13px]">
      <div className="h-14 max-w-7xl w-full mx-auto px-4 sm:px-8 flex items-center gap-2 lg:gap-3">
        <HeaderNavLinks dense />
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <div className="flex justify-end min-w-0 shrink">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar className="min-w-0 max-w-[240px] w-full [&_input]:min-w-0 [&_input]:text-xs [&_button]:text-xs [&_button]:py-1.5 [&_button]:px-3" />
            </Suspense>
          </div>
          <UserAuthArea variant="compact" />
        </div>
      </div>
    </header>
  );
}

function SearchBarFallback() {
  return (
    <div className="w-full max-w-[240px] h-[32px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
