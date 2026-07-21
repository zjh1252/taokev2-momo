'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/lib/auth/auth-context';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { CartBadge } from '@/features/cart/components/CartBadge';
import { SearchBar } from '@/components/layout/search-bar';

/** 集团产品矩阵（与 public 顶栏保持一致） */
const GROUP_LINKS = [
  { label: '淘课集团', href: '#' },
  { label: '淘课网', href: '#' },
  { label: '培训宝', href: '#' },
  { label: '目标通', href: '#' },
  { label: 'AI 导师', href: '#' },
  { label: '智能创导', href: '#' },
  { label: 'AI 陪练', href: '#' },
];

/** 主导航链接（与 AppHeader 同步） */
const NAV_LINKS = [
  { label: '首页', href: ROUTES.HOME },
  { label: '专家', href: ROUTES.TRAINERS },
  { label: '公开课', href: ROUTES.PUBLIC_COURSES },
  { label: '内训课', href: ROUTES.INTERNAL_COURSES },
  { label: '录播课', href: ROUTES.ONLINE_COURSES },
  { label: '机构', href: ROUTES.INSTITUTIONS },
  { label: '培协', href: ROUTES.ASSOCIATIONS },
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
 * 用户中心 Header — 与 (public) 的 TopNavBar + AppHeader 视觉一致，
 * 但保留白色系背景（不再使用红色主题），与 public 的两栏布局对齐：
 * <ul>
 *   <li>上栏：集团站点 + 用户认证区域（含购物车/通知/角色后缀）</li>
 *   <li>下栏：Logo + 主导航 + 搜索栏（突出当前所在「用户中心」入口）</li>
 * </ul>
 *
 * <p>「代码直接拷贝即可，但颜色估计要使用之前的白色系」— 此文件保留独立结构，
 * 不引用 public TopNavBar / AppHeader，便于后续白色系微调。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-21 10:00
 */
export function UserCenterHeader() {
  const { user, logout, publicHomeHref, activeRole } = useAuth();
  const roleSuffix = activeRole && ROLE_LABELS[activeRole] ? `（${ROLE_LABELS[activeRole]}）` : '';

  return (
    <>
      {/* ===== 顶部辅助导航（集团矩阵 + 用户认证） ===== */}
      <div className="w-full bg-slate-50 border-b border-slate-100 text-xs py-1.5 px-8 z-50 sticky top-0">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-500">
            {GROUP_LINKS.map((link, i) => (
              <span key={link.label} className="flex items-center gap-3">
                {i > 0 && <span className="text-slate-300">|</span>}
                <a href={link.href} className="hover:text-primary transition-colors">
                  {link.label}
                </a>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            {user && (
              <>
                <CartBadge />
                <span className="text-slate-300">|</span>
                <NotificationBell />
                <span className="text-slate-300">|</span>
              </>
            )}
            {/* 用户区域：头像 + 昵称（含角色后缀）+ 用户中心 + 我的主页 + 退出 */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={ROUTES.DASHBOARD}
                  className="group flex items-center gap-1.5 min-w-0 hover:text-primary transition-colors"
                >
                  <UserAvatar src={user.avatarUrl} name={user.nickname} size={22} />
                  <span className="text-slate-700 font-medium max-w-[160px] truncate group-hover:text-primary">
                    {user.nickname}
                    {roleSuffix && <span className="text-slate-500 ml-1">{roleSuffix}</span>}
                  </span>
                </Link>
                <span className="text-slate-300">|</span>
                {/* 当前页是用户中心，链接保留但加粗下划线突显「正在所在」位置 */}
                <Link
                  href={ROUTES.DASHBOARD}
                  className="text-primary font-bold border-b border-primary pb-0.5"
                >
                  用户中心
                </Link>
                {publicHomeHref && (
                  <>
                    <span className="text-slate-300">|</span>
                    <Link
                      href={publicHomeHref}
                      className="hover:text-primary transition-colors"
                    >
                      个人主页
                    </Link>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={logout}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={ROUTES.LOGIN} className="hover:text-primary transition-colors">
                  登录
                </Link>
                <span className="text-slate-300">|</span>
                <Link href={ROUTES.REGISTER} className="hover:text-primary transition-colors">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 主导航栏（Logo + 导航 + 搜索） ===== */}
      <nav className="h-[80px] w-full bg-white/90 backdrop-blur-md sticky top-[29px] z-40 shadow-sm px-8 flex flex-col justify-center transition-all duration-300">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
          <div className="flex items-center gap-6 shrink-0">
            <Link href={ROUTES.HOME} className="flex items-center gap-2">
              <Image
                src="/statics/images/taoke-new-logo.jpg"
                alt="淘课网 Logo"
                width={40}
                height={40}
                className="size-10 rounded-md object-contain"
                priority
              />
              <span className="text-2xl font-black tracking-tighter text-slate-900">
                淘课网
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-8 shrink-0">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-slate-600 font-medium hover:text-primary transition-colors text-[15px]"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center ml-4 flex-1 max-w-md justify-end">
            <SearchBar />
          </div>
        </div>
      </nav>
    </>
  );
}
