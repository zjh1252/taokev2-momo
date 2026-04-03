'use client';

import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import { GraduationCap } from 'lucide-react';

const NAV_LINKS = [
  { label: '首页', href: ROUTES.HOME },
  { label: '专家', href: ROUTES.TRAINERS },
  { label: '公开课', href: ROUTES.PUBLIC_COURSES },
  { label: '内训课', href: ROUTES.INTERNAL_COURSES },
  { label: '录播课', href: ROUTES.ONLINE_COURSES },
  { label: '机构', href: ROUTES.INSTITUTIONS },
] as const;

/**
 * 用户中心专用 Header — 红色背景主题，与 (public) 的 AppHeader 完全独立
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
export function UserCenterHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary text-white h-[60px] flex items-center shadow-md sticky top-0 z-50">
      <div className="max-w-[1200px] w-full mx-auto px-4 flex justify-between items-center">
        {/* 左侧：Logo + 导航 */}
        <div className="flex items-center gap-8">
          <Link href={ROUTES.HOME} className="flex items-center gap-1.5">
            <GraduationCap className="size-7 text-white" strokeWidth={2.5} />
            <span className="text-2xl font-black tracking-tighter cursor-pointer">
              淘课网
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 text-[15px] font-medium">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-white/80 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 右侧：用户信息 */}
        <div className="flex items-center gap-4 text-sm">
          {user && (
            <span className="text-white/90">欢迎您，{user.nickname}</span>
          )}
          <span className="w-[1px] h-3 bg-white/30" />
          <Link
            href={ROUTES.DASHBOARD}
            className="font-bold border-b border-white pb-0.5"
          >
            用户中心
          </Link>
          <span className="w-[1px] h-3 bg-white/30" />
          <button
            type="button"
            onClick={logout}
            className="hover:text-white/80 transition-colors cursor-pointer"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
