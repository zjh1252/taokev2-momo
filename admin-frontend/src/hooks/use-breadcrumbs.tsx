'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: '控制台',
  overview: '总览',
  users: '用户管理',
  product: '课程管理',
  notifications: '通知'
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: '控制台', link: '/dashboard' }],
  '/dashboard/overview': [
    { title: '控制台', link: '/dashboard' },
    { title: '总览', link: '/dashboard/overview' }
  ],
  '/dashboard/users': [
    { title: '控制台', link: '/dashboard' },
    { title: '用户管理', link: '/dashboard/users' }
  ],
  '/dashboard/product': [
    { title: '控制台', link: '/dashboard' },
    { title: '课程管理', link: '/dashboard/product' }
  ],
  '/dashboard/notifications': [
    { title: '控制台', link: '/dashboard' },
    { title: '通知', link: '/dashboard/notifications' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
