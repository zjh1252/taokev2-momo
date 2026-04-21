'use client';

import { useState, useMemo } from 'react';
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
  Briefcase,
  Camera,
  Users,
  Building2,
  MapPin,
  UserPlus,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** 内容管理类菜单可见的角色集合 */
const CONTENT_ROLES = ['TRAINER', 'AGENT', 'ASSISTANT', 'INSTITUTION', 'INSTITUTION_EMPLOYEE'];

type NavItem = {
  kind: 'item';
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  /** 不设置则对所有角色可见；设置则仅 activeRole 在列表中时显示 */
  visibleForRoles?: string[];
  /** 占位菜单，功能尚未实现 */
  isPlaceholder?: boolean;
};

type NavGroup = {
  kind: 'group';
  label: string;
  icon: React.ReactNode;
  children: { label: string; href: string }[];
  separator?: boolean;
  visibleForRoles?: string[];
  isPlaceholder?: boolean;
};

type NavEntry = NavItem | NavGroup;

/**
 * 构建完整的导航配置。
 * 角色感知：含 visibleForRoles 的条目只在 activeRole 匹配时显示。
 */
const NAV_ENTRIES: NavEntry[] = [
  // ── 通用：始终显示 ──
  { kind: 'item', label: '我的淘课网', href: ROUTES.DASHBOARD, icon: <Home className="size-5" /> },
  { kind: 'item', label: '消息中心', href: ROUTES.UC_MESSAGES, icon: <Mail className="size-5" /> },
  {
    kind: 'group', label: '我的账号', icon: <UserCog className="size-5" />, separator: true,
    children: [
      { label: '修改身份', href: ROUTES.UC_ACCOUNT_SWITCH },
      { label: '账号信息', href: ROUTES.UC_ACCOUNT_BASE },
      { label: '修改密码', href: ROUTES.UC_ACCOUNT_PASSWORD },
      { label: '账号认证', href: ROUTES.UC_ACCOUNT_VERIFY },
      { label: '账号绑定', href: ROUTES.UC_ACCOUNT_BIND },
    ],
  },

  // ── 角色特有：我的专家（统一的列表 + 添加 + 状态筛选；机构员工为只读视图） ──
  {
    kind: 'item', label: '我的专家', href: ROUTES.UC_MY_EXPERTS, icon: <Users className="size-5" />,
    visibleForRoles: ['AGENT', 'ASSISTANT', 'INSTITUTION', 'ENTERPRISE_AGENT', 'INSTITUTION_EMPLOYEE'],
  },

  // ── 我的业务（经纪人 和 经纪公司 子菜单略有不同） ──
  {
    kind: 'group', label: '我的业务', icon: <BarChart3 className="size-5" />,
    visibleForRoles: ['AGENT'],
    isPlaceholder: true,
    children: [
      { label: '接收订单', href: ROUTES.UC_MY_BUSINESS_ORDERS },
      { label: '客户评价', href: ROUTES.UC_MY_BUSINESS_REVIEWS },
      { label: '专家数据', href: ROUTES.UC_MY_BUSINESS_DATA },
    ],
  },
  {
    kind: 'group', label: '我的业务', icon: <BarChart3 className="size-5" />,
    visibleForRoles: ['ENTERPRISE_AGENT'],
    isPlaceholder: true,
    children: [
      { label: '接收订单', href: ROUTES.UC_MY_BUSINESS_ORDERS },
      { label: '客户评价', href: ROUTES.UC_MY_BUSINESS_REVIEWS },
      { label: '成交数据', href: ROUTES.UC_MY_BUSINESS_DATA },
    ],
  },

  // ── 我的机构（机构员工专属） ──
  {
    kind: 'item', label: '我的机构', href: ROUTES.UC_MY_INSTITUTION, icon: <Building2 className="size-5" />,
    visibleForRoles: ['INSTITUTION_EMPLOYEE'],
  },

  // ── 我的经纪公司（经纪人专属） ──
  {
    kind: 'item', label: '我的经纪公司', href: ROUTES.UC_MY_ENTERPRISE_AGENT, icon: <Briefcase className="size-5" />,
    visibleForRoles: ['AGENT'],
  },

  // ── 我的员工（培训机构专属） ──
  {
    kind: 'item', label: '我的员工', href: ROUTES.UC_MY_EMPLOYEES, icon: <UserPlus className="size-5" />,
    visibleForRoles: ['INSTITUTION'],
  },

  // ── 我的经纪团队（经纪公司专属） ──
  {
    kind: 'item', label: '我的经纪人', href: ROUTES.UC_MY_AGENTS_TEAM, icon: <UserPlus className="size-5" />,
    visibleForRoles: ['ENTERPRISE_AGENT'],
  },

  // ── 我的场地（培训机构专属） ──
  {
    kind: 'item', label: '我的场地', href: ROUTES.UC_MY_VENUES, icon: <MapPin className="size-5" />,
    visibleForRoles: ['INSTITUTION'],
  },

  // ── 内容管理类（TRAINER / AGENT / ASSISTANT / INSTITUTION / INSTITUTION_EMPLOYEE） ──
  {
    kind: 'group', label: '我的课程', icon: <BookOpen className="size-5" />,
    visibleForRoles: CONTENT_ROLES,
    children: [
      { label: '发布课程', href: ROUTES.UC_COURSES_CREATE },
      { label: '管理课程', href: ROUTES.UC_COURSES_MANAGE },
    ],
  },
  {
    kind: 'group', label: '我的案例', icon: <Briefcase className="size-5" />,
    visibleForRoles: CONTENT_ROLES,
    children: [
      { label: '发布案例', href: ROUTES.UC_CASES_CREATE },
      { label: '管理案例', href: ROUTES.UC_CASES_MANAGE },
    ],
  },
  {
    kind: 'group', label: '精彩瞬间', icon: <Camera className="size-5" />,
    visibleForRoles: CONTENT_ROLES,
    children: [
      { label: '发布精彩瞬间', href: ROUTES.UC_HIGHLIGHTS_CREATE },
      { label: '管理精彩瞬间', href: ROUTES.UC_HIGHLIGHTS_MANAGE },
    ],
  },
  {
    kind: 'group', label: '我的视频', icon: <Video className="size-5" />,
    visibleForRoles: CONTENT_ROLES,
    children: [
      { label: '发布录播课', href: ROUTES.UC_VIDEOS_CREATE },
      { label: '管理录播课', href: ROUTES.UC_VIDEOS_MANAGE },
    ],
  },

  // ── 我的代理（专家专属） ──
  {
    kind: 'item', label: '我的代理', href: ROUTES.UC_MY_AGENTS, icon: <Handshake className="size-5" />,
    visibleForRoles: ['TRAINER'],
  },

  // ── 通用：始终显示 ──
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
];

/**
 * 用户中心左侧导航菜单 — 根据 activeRole 动态过滤可见条目
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
export function UserCenterSidebar() {
  const pathname = usePathname();
  const { activeRole } = useAuth();

  const visibleEntries = useMemo(
    () => NAV_ENTRIES.filter((e) => !e.visibleForRoles || e.visibleForRoles.includes(activeRole)),
    [activeRole],
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of visibleEntries) {
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
          {visibleEntries.map((entry) => {
            if (entry.kind === 'item') {
              return (
                <Link
                  key={entry.href + entry.label}
                  href={entry.href}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3.5 text-gray-600 hover:bg-slate-50 hover:text-primary transition-colors border-l-4 border-transparent',
                    isActive(entry.href) &&
                      'bg-red-50/50 text-primary font-bold !border-l-primary',
                  )}
                >
                  {entry.icon}
                  {entry.label}
                  {entry.isPlaceholder && (
                    <span className="ml-auto flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      <Sparkles className="size-2.5" />
                      即将上线
                    </span>
                  )}
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
              <div key={entry.label + (entry.visibleForRoles?.join('') ?? '')} className="relative">
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
                    {entry.isPlaceholder && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                        <Sparkles className="size-2.5" />
                        即将上线
                      </span>
                    )}
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
