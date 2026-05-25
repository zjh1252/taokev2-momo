'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { GraduationCap } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import { SearchBar } from './search-bar';

/** 主导航链接配置 */
const NAV_LINKS = [
  { key: 'home', href: ROUTES.HOME },
  { key: 'trainers', href: ROUTES.TRAINERS },
  { key: 'publicCourses', href: ROUTES.PUBLIC_COURSES },
  { key: 'internalCourses', href: ROUTES.INTERNAL_COURSES },
  { key: 'onlineCourses', href: ROUTES.ONLINE_COURSES },
  { key: 'institutions', href: ROUTES.INSTITUTIONS },
  { key: 'associations', href: ROUTES.ASSOCIATIONS },
] as const;

function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === ROUTES.HOME) {
    return pathname === '/' || pathname === '';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 主导航栏 — 毛玻璃背景、Logo 图标 + 文字、导航链接、搜索栏
 * <p>导航项悬停 / 当前栏目页展示红色底边线（对齐老站）</p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:00
 */
export function AppHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className="h-[80px] w-full bg-white/90 backdrop-blur-md sticky top-[29px] z-40 shadow-sm px-8 flex flex-col justify-center transition-all duration-300">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
        {/* 左侧：Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <GraduationCap className="size-8 text-primary" strokeWidth={2.5} />
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              淘课网
            </span>
          </Link>
        </div>

        {/* 中间：主导航链接 */}
        <div className="hidden lg:flex items-stretch gap-8 shrink-0 self-stretch">
          {NAV_LINKS.map(({ key, href }) => {
            const active = isNavLinkActive(href, pathname);
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  'flex items-center px-0.5 text-[15px] font-medium border-b-4 transition-colors',
                  active
                    ? 'text-primary border-primary font-bold'
                    : 'text-slate-600 border-transparent hover:text-primary hover:border-primary',
                )}
              >
                {t(key)}
              </Link>
            );
          })}
        </div>

        {/* 右侧：搜索栏 */}
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
