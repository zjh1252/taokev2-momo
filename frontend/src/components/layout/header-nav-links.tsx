'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

export const NAV_LINKS = [
  { key: 'home', href: ROUTES.HOME },
  { key: 'trainers', href: ROUTES.TRAINERS },
  { key: 'publicCourses', href: ROUTES.PUBLIC_COURSES },
  { key: 'internalCourses', href: ROUTES.INTERNAL_COURSES },
  { key: 'onlineCourses', href: ROUTES.ONLINE_COURSES },
  { key: 'institutions', href: ROUTES.INSTITUTIONS },
  { key: 'associations', href: ROUTES.ASSOCIATIONS },
] as const;

export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === ROUTES.HOME) {
    return pathname === '/' || pathname === '';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderNavLinksProps = {
  className?: string;
  /** 详情顶栏更紧凑：缩小字号与间距 */
  dense?: boolean;
};

export function HeaderNavLinks({ className, dense = false }: HeaderNavLinksProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'hidden lg:flex items-stretch shrink-0 self-stretch',
        dense ? 'gap-5' : 'gap-8',
        className,
      )}
    >
      {NAV_LINKS.map(({ key, href }) => {
        const active = isNavLinkActive(href, pathname);
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              'flex items-center px-0.5 font-medium transition-colors',
              dense ? 'text-[13px] border-b-2' : 'text-[15px] border-b-4',
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
  );
}
