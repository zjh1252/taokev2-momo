'use client';

import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/config/routes';

/**
 * 用户中心登录守卫 — /dashboard 下所有页面均需登录。
 *
 * <p>登录态保存在 localStorage（无 cookie，无法用中间件在服务端拦截），
 * 故在客户端校验：未登录时 replace 跳转到登录页并带回跳地址 {@code ?redirect=}，
 * 校验期间/未登录时只渲染加载态，避免受保护内容闪现。</p>
 *
 * @author Fangxinxin
 * @date 2026-06-02 17:30
 */
export function DashboardAuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading || user) return;
    const qs = searchParams?.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(target)}`);
  }, [loading, user, pathname, searchParams, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc]">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
