'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * 用户认证区域 — 顶部辅导航栏中使用的公共组件
 * <p>
 * 未登录 → "登录/注册" 链接<br/>
 * 已登录 → 圆圈头像 + 昵称 + 用户中心 + 我的主页(仅专家/机构角色激活时) + 登出
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:00
 */
export function UserAuthArea() {
  const t = useTranslations('nav');
  const { user, loading, logout, publicHomeHref } = useAuth();

  if (loading) {
    return <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href={ROUTES.LOGIN}
        className="hover:text-primary transition-colors"
      >
        {t('loginRegister')}
      </Link>
    );
  }

  const initials = getInitials(user.nickname);

  return (
    <div className="flex items-center gap-3">
      {/* 头像 */}
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.nickname}
          width={22}
          height={22}
          className="size-[22px] rounded-full object-cover"
        />
      ) : (
        <div className="size-[22px] rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {initials}
        </div>
      )}

      {/* 昵称 */}
      <span className="text-slate-700 font-medium max-w-[72px] truncate">
        {user.nickname}
      </span>

      <Separator />

      <Link
        href={ROUTES.DASHBOARD}
        className="hover:text-primary transition-colors"
      >
        {t('userCenter')}
      </Link>

      {publicHomeHref && (
        <>
          <Separator />
          <Link
            href={publicHomeHref}
            className="hover:text-primary transition-colors"
          >
            {t('myPage')}
          </Link>
        </>
      )}

      <Separator />

      <button
        type="button"
        onClick={logout}
        className="hover:text-primary transition-colors cursor-pointer"
      >
        {t('logout')}
      </button>
    </div>
  );
}

function Separator() {
  return <span className="text-slate-300">|</span>;
}

/** 从昵称中提取最多 2 个字符作为头像 initials */
function getInitials(name: string): string {
  if (!name) return '?';
  const upper = name.toUpperCase();
  if (/^[A-Z]/.test(upper)) {
    return upper.slice(0, 2);
  }
  return name.slice(0, 1);
}
