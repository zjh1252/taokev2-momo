'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { MobileSiteNavDrawer } from './mobile-site-nav-drawer';
import { SearchBar } from './search-bar';

/**
 * 主导航栏 — 毛玻璃背景、Logo 图标 + 文字、导航链接、搜索栏
 * <p>导航项悬停 / 当前栏目页展示红色底边线（对齐老站）</p>
 * <p>移动端：汉堡抽屉展示全部一级菜单，顶栏仅保留 Logo + 搜索</p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:00
 */
export function AppHeader() {
  return (
    <nav className="sticky top-[29px] z-40 flex min-h-[64px] w-full max-w-full flex-col justify-center bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md transition-all duration-300 sm:px-6 lg:h-[80px] lg:px-8 lg:py-0">
      <div className="mx-auto flex h-full w-full max-w-7xl min-w-0 items-center gap-2 sm:gap-4">
        <MobileSiteNavDrawer />
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end lg:max-w-md">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar className="w-full max-w-[min(100%,420px)]" />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

function SearchBarFallback() {
  return (
    <div className="h-[38px] w-full max-w-[420px] animate-pulse rounded-md border border-slate-200 bg-slate-100" />
  );
}
