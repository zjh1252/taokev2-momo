'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { SearchBar } from './search-bar';

/**
 * 主导航栏 — 毛玻璃背景、Logo 图标 + 文字、导航链接、搜索栏
 * <p>导航项悬停 / 当前栏目页展示红色底边线（对齐老站）</p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:00
 */
export function AppHeader() {
  return (
    <nav className="h-[80px] w-full bg-white/90 backdrop-blur-md sticky top-[29px] z-40 shadow-sm px-8 flex flex-col justify-center transition-all duration-300">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="flex items-center ml-4 flex-1 max-w-md justify-end">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

function SearchBarFallback() {
  return (
    <div className="min-w-[360px] h-[38px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
