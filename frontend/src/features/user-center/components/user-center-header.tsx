'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/lib/auth/auth-context';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { CartBadge } from '@/features/cart/components/CartBadge';
import { SearchBar } from '@/components/layout/search-bar';
import { MobileSiteNavDrawer } from '@/components/layout/mobile-site-nav-drawer';
import { HeaderNavLinks } from '@/components/layout/header-nav-links';

/** 集团产品矩阵（与 public TopNavBar 保持一致） */
const GROUP_LINKS = [
  { label: '淘课集团', href: 'https://www.taoke.com.cn/' },
  { label: '培训宝', href: 'https://www.91pxb.com/' },
  { label: '目标通', href: 'https://www.91mbt.com/' },
  { label: 'AI 导师', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/mentor/604996/list' },
  { label: '智能创导', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/extraction/604996' },
  { label: 'AI 陪练', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/training_partner/604996/list' },
] as const;

/** 当前激活角色 code → 中文展示名 */
const ROLE_LABELS: Record<string, string> = {
  BUYER: '个人学员',
  ENTERPRISE_BUYER: '企业采购',
  TRAINER: '专家',
  AGENT: '经纪人',
  ASSISTANT: '助理',
  ENTERPRISE_AGENT: '经纪公司',
  INSTITUTION: '机构',
  INSTITUTION_EMPLOYEE: '机构员工',
  PLATFORM_AUDITOR: '审核员',
  PLATFORM_CS: '客服',
  SUPER_ADMIN: '超管',
};

/**
 * 用户中心 Header — 与 public 视觉对齐；移动端汉堡抽屉 + Logo + 搜索，无永久横向菜单
 *
 * @author Fangxinxin
 * @date 2026-05-21 10:00
 */
export function UserCenterHeader() {
  const { user, logout, publicHomeHref, activeRole } = useAuth();
  const roleSuffix = activeRole && ROLE_LABELS[activeRole] ? `（${ROLE_LABELS[activeRole]}）` : '';

  return (
    <>
      <div className="sticky top-0 z-50 w-full max-w-full overflow-x-clip border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-xs sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain text-slate-500 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GROUP_LINKS.map((link, i) => (
              <span key={link.label} className="flex shrink-0 items-center gap-3">
                {i > 0 && <span className="text-slate-300">|</span>}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 text-slate-500 sm:gap-3">
            {user && (
              <>
                <CartBadge />
                <span className="hidden text-slate-300 sm:inline">|</span>
                <NotificationBell />
                <span className="hidden text-slate-300 sm:inline">|</span>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={ROUTES.DASHBOARD}
                  className="group flex min-w-0 items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <UserAvatar src={user.avatarUrl} name={user.nickname} size={22} />
                  <span className="hidden max-w-[120px] truncate font-medium text-slate-700 group-hover:text-primary sm:inline md:max-w-[160px]">
                    {user.nickname}
                    {roleSuffix && <span className="ml-1 text-slate-500">{roleSuffix}</span>}
                  </span>
                </Link>
                <span className="hidden text-slate-300 md:inline">|</span>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="hidden border-b border-primary pb-0.5 font-bold text-primary md:inline"
                >
                  用户中心
                </Link>
                {publicHomeHref && (
                  <>
                    <span className="hidden text-slate-300 lg:inline">|</span>
                    <Link
                      href={publicHomeHref}
                      className="hidden transition-colors hover:text-primary lg:inline"
                    >
                      个人主页
                    </Link>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={logout}
                  className="cursor-pointer transition-colors hover:text-primary"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={ROUTES.LOGIN} className="transition-colors hover:text-primary">
                  登录
                </Link>
                <span className="text-slate-300">|</span>
                <Link href={ROUTES.REGISTER} className="transition-colors hover:text-primary">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="sticky top-[29px] z-40 flex min-h-[64px] w-full max-w-full flex-col justify-center bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md transition-all duration-300 sm:px-6 lg:h-[80px] lg:px-8 lg:py-0">
        <div className="mx-auto flex h-full w-full max-w-7xl min-w-0 items-center gap-2 sm:gap-4">
          <MobileSiteNavDrawer />
          <Link href={ROUTES.HOME} className="flex shrink-0 items-center gap-2">
            <Image
              src="/statics/images/taoke-new-logo.jpg"
              alt="淘课网 Logo"
              width={40}
              height={40}
              className="size-9 rounded-md object-contain sm:size-10"
              priority
            />
            <span className="hidden text-2xl font-black tracking-tighter text-slate-900 sm:inline">
              淘课网
            </span>
          </Link>

          <HeaderNavLinks />

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end lg:max-w-md">
            <Suspense
              fallback={
                <div className="h-[38px] w-full max-w-[420px] animate-pulse rounded-md border border-slate-200 bg-slate-100" />
              }
            >
              <SearchBar className="w-full max-w-[min(100%,420px)]" />
            </Suspense>
          </div>
        </div>
      </nav>
    </>
  );
}
