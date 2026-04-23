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

/** 个人学员角色码（"更多信息"仅对其可见） */
const LEARNER_ROLES = ['BUYER'];

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

/** 子菜单节点：可以是叶子（带 href）或二级折叠组（含 children） */
type NavLeaf = { label: string; href: string; visibleForRoles?: string[] };
type NavChild =
  | NavLeaf
  | { label: string; children: NavLeaf[]; visibleForRoles?: string[] };

type NavGroup = {
  kind: 'group';
  label: string;
  icon: React.ReactNode;
  children: NavChild[];
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
      // 身份信息 = 二级折叠组（按角色显示子项）
      {
        label: '身份信息',
        children: [
          { label: '基础信息', href: ROUTES.UC_ACCOUNT_BASE },
          // 个人学员才有「更多信息」
          { label: '更多信息', href: ROUTES.UC_ACCOUNT_MORE, visibleForRoles: LEARNER_ROLES },
          // 专家：资质认证 4 项
          { label: '实名认证', href: ROUTES.UC_ACCOUNT_CERT_REAL_NAME, visibleForRoles: ['TRAINER'] },
          { label: '专业认证', href: ROUTES.UC_ACCOUNT_CERT_PROFESSIONAL, visibleForRoles: ['TRAINER'] },
          { label: '学历认证', href: ROUTES.UC_ACCOUNT_CERT_EDUCATION, visibleForRoles: ['TRAINER'] },
          { label: '工作认证', href: ROUTES.UC_ACCOUNT_CERT_WORK, visibleForRoles: ['TRAINER'] },
        ],
      },
      { label: '账号绑定', href: ROUTES.UC_ACCOUNT_BIND },
      { label: '修改密码', href: ROUTES.UC_ACCOUNT_PASSWORD },
      { label: '修改身份', href: ROUTES.UC_ACCOUNT_SWITCH },
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

  /** 子菜单按 visibleForRoles 过滤（含三级孙菜单按角色过滤） */
  const filterChildren = (children: NavChild[]) =>
    children
      .filter((c) => !c.visibleForRoles || c.visibleForRoles.includes(activeRole))
      .map((c) => {
        if ('children' in c) {
          return {
            ...c,
            children: c.children.filter(
              (sc) => !sc.visibleForRoles || sc.visibleForRoles.includes(activeRole),
            ),
          };
        }
        return c;
      })
      // 二级组若所有子项被过滤为空，则隐藏
      .filter((c) => !('children' in c) || c.children.length > 0);

  const visibleEntries = useMemo(
    () =>
      NAV_ENTRIES.filter((e) => !e.visibleForRoles || e.visibleForRoles.includes(activeRole))
        .map((e) => {
          if (e.kind === 'group') {
            return { ...e, children: filterChildren(e.children) };
          }
          return e;
        })
        .filter((e) => e.kind !== 'group' || (e as NavGroup).children.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeRole],
  );

  const childActiveHrefs = (children: NavChild[]): string[] => {
    const out: string[] = [];
    for (const c of children) {
      if ('href' in c) out.push(c.href);
      else out.push(...c.children.map((sc) => sc.href));
    }
    return out;
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of visibleEntries) {
      if (entry.kind === 'group' && childActiveHrefs(entry.children).some((h) => pathname === h)) {
        init[entry.label] = true;
      }
    }
    return init;
  });

  // 二级折叠组展开状态（key: 父组label::子组label）
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of visibleEntries) {
      if (entry.kind !== 'group') continue;
      for (const child of entry.children) {
        if ('children' in child && child.children.some((sc) => sc.href === pathname)) {
          init[`${entry.label}::${child.label}`] = true;
        }
      }
    }
    return init;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleSubGroup = (parentLabel: string, childLabel: string) => {
    const key = `${parentLabel}::${childLabel}`;
    setExpandedSubGroups((prev) => ({ ...prev, [key]: !prev[key] }));
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
            const allChildHrefs = childActiveHrefs(entry.children);
            const groupActive = allChildHrefs.some((h) => isActive(h));

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
                    {entry.children.map((child) => {
                      // 二级折叠组
                      if ('children' in child) {
                        const subKey = `${entry.label}::${child.label}`;
                        const subExpanded = !!expandedSubGroups[subKey];
                        const subActive = child.children.some((sc) => isActive(sc.href));
                        return (
                          <div key={subKey}>
                            <button
                              type="button"
                              onClick={() => toggleSubGroup(entry.label, child.label)}
                              className={cn(
                                'w-full flex items-center justify-between pl-[52px] pr-6 py-2.5 text-[13px] text-gray-500 hover:text-primary hover:bg-red-50/50 transition-colors border-l-4 border-transparent',
                                subActive && 'text-primary font-medium',
                              )}
                            >
                              <span>{child.label}</span>
                              <ChevronDown
                                className={cn(
                                  'size-3.5 transition-transform',
                                  subExpanded && 'rotate-180',
                                )}
                              />
                            </button>
                            {subExpanded && (
                              <div className="flex flex-col">
                                {child.children.map((sc) => (
                                  <Link
                                    key={sc.href}
                                    href={sc.href}
                                    className={cn(
                                      'pl-[72px] pr-6 py-2 text-[12px] text-gray-500 hover:text-primary hover:bg-red-50/50 transition-colors border-l-4 border-transparent',
                                      isActive(sc.href) &&
                                        'text-primary font-bold !border-l-primary bg-red-50/50',
                                    )}
                                  >
                                    {sc.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      // 普通叶子
                      return (
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
                      );
                    })}
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
