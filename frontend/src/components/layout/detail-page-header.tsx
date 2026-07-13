'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { HeaderUserActions } from './header-user-actions';
import { SearchBar } from './search-bar';

/**
 * 详情页单行顶栏 — Logo + 频道导航 + 搜索 + 用户区（无集团产品矩阵条）
 */
export function DetailPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="h-[88px] max-w-7xl w-full mx-auto px-4 sm:px-8 flex items-center gap-3 lg:gap-4">
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
          <div className="flex flex-1 max-w-md justify-end min-w-0">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
          </div>
          <HeaderUserActions className="hidden sm:flex shrink-0" />
        </div>
      </div>
    </header>
  );
}

function SearchBarFallback() {
  return (
    <div className="w-full max-w-[360px] h-[38px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
