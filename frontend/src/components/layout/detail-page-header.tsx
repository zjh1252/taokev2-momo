'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { UserAuthArea } from './header-auth';
import { SearchBar } from './search-bar';

/**
 * 详情页单行顶栏 — Logo + 频道导航 + 收窄搜索 + 精简用户区（无购物车/通知）
 */
export function DetailPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="h-[88px] max-w-7xl w-full mx-auto px-4 sm:px-8 flex items-center gap-3 lg:gap-4">
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
          <div className="flex justify-end min-w-0 shrink">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar className="min-w-0 max-w-[280px] w-full [&_input]:min-w-0" />
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
    <div className="w-full max-w-[280px] h-[38px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
