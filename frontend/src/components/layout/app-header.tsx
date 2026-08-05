'use client';

import { Suspense, useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks, NAV_LINKS, isNavLinkActive } from './header-nav-links';
import { SearchBar } from './search-bar';
import { cn } from '@/lib/utils';

/**
 * 主导航栏 — 毛玻璃背景、Logo 图标 + 文字、导航链接、搜索栏
 * <p>导航项悬停 / 当前栏目页展示红色底边线（对齐老站）</p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:00
 */
export function AppHeader() {
  return (
    <nav className="min-h-[64px] w-full bg-white/90 backdrop-blur-md sticky top-[29px] z-40 shadow-sm px-3 py-2 flex flex-col justify-center transition-all duration-300 sm:px-6 lg:h-[80px] lg:px-8 lg:py-0">
      <div className="max-w-7xl w-full mx-auto flex items-center gap-2 h-full sm:gap-4">
        <MobileNavDrawer />
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
    <div className="h-[38px] w-full max-w-[420px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}

function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 hover:text-primary lg:hidden"
        aria-label="打开导航菜单"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      <SheetContent side="left" className="w-[86vw] max-w-[320px] gap-0 p-0">
        <SheetHeader className="border-b border-slate-100 px-5 py-4">
          <SheetTitle>导航</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col py-2">
          {NAV_LINKS.map(({ key, href }) => {
            const active = isNavLinkActive(href, pathname);
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex h-12 items-center px-5 text-[15px] font-medium transition-colors',
                  active
                    ? 'bg-primary/5 text-primary'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-primary',
                )}
              >
                {t(key)}
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
