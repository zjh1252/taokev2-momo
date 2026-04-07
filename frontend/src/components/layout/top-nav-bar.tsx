'use client';

import { UserAuthArea } from './header-auth';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { CartBadge } from '@/features/cart/components/CartBadge';

/** 集团产品矩阵链接 */
const GROUP_LINKS = [
  { label: '淘课集团', href: '#' },
  { label: '淘课网', href: '#' },
  { label: '培训宝', href: '#' },
  { label: '目标通', href: '#' },
  { label: 'AI 导师', href: '#' },
  { label: '智能创导', href: '#' },
  { label: 'AI 陪练', href: '#' },
];

/**
 * 顶部辅助导航栏 — 集团产品矩阵 + 用户认证区域
 * <p>
 * 右侧使用 UserAuthArea 组件统一处理登录状态和角色判断
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:05
 */
export function TopNavBar() {
  return (
    <div className="w-full bg-slate-50 border-b border-slate-100 text-xs py-1.5 px-8 z-50 sticky top-0">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        {/* 左侧：集团站点 */}
        <div className="flex items-center gap-3 text-slate-500">
          {GROUP_LINKS.map((link, i) => (
            <span key={link.label} className="flex items-center gap-3">
              {i > 0 && <span className="text-slate-300">|</span>}
              <a
                href={link.href}
                className="hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>

        {/* 右侧：购物车 + 通知 + 用户认证区域 */}
        <div className="flex items-center gap-3 text-slate-500">
          <CartBadge />
          <span className="text-slate-300">|</span>
          <NotificationBell />
          <span className="text-slate-300">|</span>
          <UserAuthArea />
        </div>
      </div>
    </div>
  );
}
