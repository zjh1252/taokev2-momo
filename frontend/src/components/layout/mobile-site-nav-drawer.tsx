'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { NAV_LINKS, isNavLinkActive } from './header-nav-links';
import { cn } from '@/lib/utils';

/**
 * 移动端站点一级导航抽屉 — Logo 旁汉堡按钮，左侧滑出全部栏目
 *
 * @author Fangxinxin
 * @date 2026-08-06 15:30
 */
export function MobileSiteNavDrawer() {
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
