'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { resolveImageSrc } from '@/lib/media';
import { useAuth } from '@/lib/auth/auth-context';

/** 当前激活角色 code → 中文展示名（顶部昵称后缀使用） */
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

type UserAuthAreaProps = {
  /** default: 列表完整用户区；compact: 详情顶栏仅头像+用户中心+退出 */
  variant?: 'default' | 'compact';
};

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
export function UserAuthArea({ variant = 'default' }: UserAuthAreaProps) {
  const t = useTranslations('nav');
  const { user, loading, logout, publicHomeHref, activeRole } = useAuth();
  const [avatarBroken, setAvatarBroken] = useState(false);
  const roleSuffix = activeRole && ROLE_LABELS[activeRole] ? `（${ROLE_LABELS[activeRole]}）` : '';

  if (loading) {
    return <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.LOGIN}
          className="hover:text-primary transition-colors"
        >
          {t('login')}
        </Link>
        <Separator />
        <Link
          href={ROUTES.REGISTER}
          className="hover:text-primary transition-colors"
        >
          {t('register')}
        </Link>
      </div>
    );
  }

  const initials = getInitials(user.nickname);
  const showAvatar = user.avatarUrl && !avatarBroken;

  const avatarNode = showAvatar ? (
    <Image
      src={resolveImageSrc(user.avatarUrl)}
      alt={user.nickname}
      width={22}
      height={22}
      unoptimized
      className="size-[22px] rounded-full object-cover"
      onError={() => setAvatarBroken(true)}
    />
  ) : (
    <div className="size-[22px] rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
      {initials}
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 shrink-0">
        {avatarNode}
        <Separator />
        <Link href={ROUTES.DASHBOARD} className="hover:text-primary transition-colors whitespace-nowrap">
          {t('userCenter')}
        </Link>
        <Separator />
        <button type="button" onClick={logout} className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap">
          {t('logout')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {avatarNode}

      {/* 昵称 + 当前激活角色（如「淘客（专家）」），便于多角色用户辨识当前身份 */}
      <span className="text-slate-700 font-medium max-w-[160px] truncate">
        {user.nickname}
        {roleSuffix && <span className="text-slate-500 ml-1">{roleSuffix}</span>}
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
