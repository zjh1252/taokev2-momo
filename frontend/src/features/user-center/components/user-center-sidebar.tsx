'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Home,
  Mail,
  GraduationCap,
  Receipt,
  ClipboardList,
  Heart,
  MessageCircle,
  Handshake,
  UserCog,
  BookOpen,
  Video,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** 显示「我的课程」菜单的角色白名单，后续可扩展 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COURSE_MENU_ROLES = ['BUYER', 'TRAINER'] as const;

type NavEntry =
  | { kind: 'item'; label: string; href: string; icon: React.ReactNode; badge?: number }
  | { kind: 'group'; label: string; icon: React.ReactNode; children: { label: string; href: string }[]; separator?: boolean };

/**
 * 统一有序导航列表，「我的课程」紧跟「消息中心」之后
 */
const NAV_ENTRIES: NavEntry[] = [
  { kind: 'item', label: '个人主页', href: ROUTES.DASHBOARD, icon: <Home className="size-5" /> },
  { kind: 'item', label: '消息中心', href: ROUTES.UC_MESSAGES, icon: <Mail className="size-5" /> },
  // TODO: 后续恢复角色控制，当前全部放行便于测试
  {
    kind: 'group', label: '我的课程', icon: <BookOpen className="size-5" />,
    children: [
      { label: '发布课程', href: ROUTES.UC_COURSES_CREATE },
      { label: '管理课程', href: ROUTES.UC_COURSES_MANAGE },
    ],
  },
  {
    kind: 'group', label: '我的视频', icon: <Video className="size-5" />,
    children: [
      { label: '发布录播课', href: ROUTES.UC_VIDEOS_CREATE },
      { label: '管理录播课', href: ROUTES.UC_VIDEOS_MANAGE },
    ],
  },
  { kind: 'item', label: '我的学习', href: ROUTES.UC_LEARNING, icon: <GraduationCap className="size-5" /> },
  { kind: 'item', label: '我的订单', href: ROUTES.UC_ORDERS, icon: <Receipt className="size-5" /> },
  { kind: 'item', label: '我的需求', href: ROUTES.UC_DEMANDS, icon: <ClipboardList className="size-5" /> },
  { kind: 'item', label: '我的收藏', href: ROUTES.UC_FAVORITES, icon: <Heart className="size-5" /> },
  { kind: 'item', label: '我的点评', href: ROUTES.UC_REVIEWS, icon: <MessageCircle className="size-5" /> },
  {
    kind: 'group', label: '淘课联盟', icon: <Handshake className="size-5" />, separator: true,
    children: [
      { label: '推广大使', href: ROUTES.UC_ALLIANCE_AMBASSADOR },
      { label: '培训合伙人', href: ROUTES.UC_ALLIANCE_PARTNER },
      { label: '721讲师合作', href: ROUTES.UC_ALLIANCE_721 },
    ],
  },
  {
    kind: 'group', label: '我的账号', icon: <UserCog className="size-5" />, separator: true,
    children: [
      { label: '身份信息', href: ROUTES.UC_ACCOUNT_INFO },
      { label: '账号信息', href: ROUTES.UC_ACCOUNT_BASE },
      { label: '账号认证', href: ROUTES.UC_ACCOUNT_VERIFY },
      { label: '账号绑定', href: ROUTES.UC_ACCOUNT_BIND },
      { label: '修改身份', href: ROUTES.UC_ACCOUNT_SWITCH },
    ],
  },
];

/**
 * 用户中心左侧导航菜单 — 支持展开/折叠子菜单
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
export function UserCenterSidebar() {
  const pathname = usePathname();
  useAuth(); // 保留 hook 调用，后续恢复角色控制时使用

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of NAV_ENTRIES) {
      if (entry.kind === 'group' && entry.children.some((c) => pathname === c.href)) {
        init[entry.label] = true;
      }
    }
    return init;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-full md:w-[220px] shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-[80px]">
        <nav className="flex flex-col py-2">
          {NAV_ENTRIES.map((entry) => {
            if (entry.kind === 'item') {
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3.5 text-gray-600 hover:bg-slate-50 hover:text-primary transition-colors border-l-4 border-transparent',
                    isActive(entry.href) &&
                      'bg-red-50/50 text-primary font-bold !border-l-primary',
                  )}
                >
                  {entry.icon}
                  {entry.label}
                  {entry.badge !== undefined && entry.badge > 0 && (
                    <span className="ml-auto bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {entry.badge}
                    </span>
                  )}
                </Link>
              );
            }

            const expanded = !!expandedGroups[entry.label];
            const groupActive = entry.children.some((c) => isActive(c.href));

            return (
              <div key={entry.label} className="relative">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-6 py-3.5 text-gray-600 hover:bg-slate-50 hover:text-primary transition-colors border-l-4 border-transparent',
                    entry.separator && 'border-t border-slate-100',
                    groupActive && 'text-primary font-bold',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {entry.icon}
                    {entry.label}
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-[18px] transition-transform',
                      expanded && 'rotate-180',
                    )}
                  />
                </button>
                {expanded && (
                  <div className="flex flex-col bg-slate-50/50">
                    {entry.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'pl-[52px] pr-6 py-2.5 text-[13px] text-gray-500 hover:text-primary hover:bg-red-50/50 transition-colors border-l-4 border-transparent',
                          isActive(child.href) &&
                            'text-primary font-bold !border-l-primary bg-red-50/50',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
