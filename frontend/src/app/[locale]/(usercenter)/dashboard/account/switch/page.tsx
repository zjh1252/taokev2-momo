'use client';

import Link from 'next/link';
import {
  Building2,
  GraduationCap,
  UserCheck,
  Headset,
  Briefcase,
  Landmark,
  IdCard,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';

const ALL_ROLES = [
  { code: 'BUYER', label: '个人学员', description: '默认角色，浏览课程、学习记录', icon: User },
  { code: 'ENTERPRISE_BUYER', label: '企业培训采购方', description: '发布培训需求、购买课程', icon: Building2 },
  { code: 'TRAINER', label: '专家', description: '发布课程、管理授课案例', icon: GraduationCap },
  { code: 'AGENT', label: '专家经纪人', description: '维护专家资源、筛选匹配推荐', icon: UserCheck },
  { code: 'ASSISTANT', label: '专家助理', description: '辅助专家运营管理', icon: Headset },
  { code: 'ENTERPRISE_AGENT', label: '专家经纪公司', description: '批量运营专家资源', icon: Briefcase },
  { code: 'INSTITUTION', label: '培训机构', description: '管理师资团队、发布课程', icon: Landmark },
  { code: 'INSTITUTION_EMPLOYEE', label: '机构员工', description: '机构内部运营人员', icon: IdCard },
  { code: '_ADMIN', label: '管理员', description: '运营角色，仅后台创建', icon: Shield, adminOnly: true },
] as const;

/**
 * 修改身份页 — 展示角色列表、当前角色高亮、未开通可申请
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:30
 */
export default function AccountSwitchPage() {
  const { user } = useAuth();
  const roleStatusMap = new Map(
    user?.roles?.map((r) => [r.role, r.status]) || [],
  );

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">修改身份</div>
      <div className="text-sm text-gray-500 mt-2">
        可基于角色体系切换当前身份视角，未开通角色可发起申请。
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        {ALL_ROLES.map((role) => {
          const status = roleStatusMap.get(role.code);
          const isActive = status === 1;
          const isPending = status === 2;
          const isAdmin = 'adminOnly' in role && role.adminOnly;
          const isDefault = role.code === 'BUYER';
          const canApply = !isActive && !isPending && !isAdmin && !isDefault;
          const Icon = role.icon;

          return (
            <div
              key={role.code}
              className={cn(
                'border rounded-xl p-4 transition-colors flex items-start gap-3',
                isActive
                  ? 'border-primary/30 bg-red-50/60'
                  : isPending
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-slate-200',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center size-10 rounded-lg shrink-0',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-slate-400',
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('font-semibold text-sm', isActive && 'text-primary')}>
                  {role.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{role.description}</div>
                <div className="mt-2 text-xs">
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <span className="size-1.5 rounded-full bg-primary" />
                      当前身份
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      审核中
                    </span>
                  )}
                  {isAdmin && (
                    <span className="text-gray-400">运营角色，仅后台创建</span>
                  )}
                  {canApply && (
                    <Link
                      href={`${ROUTES.UC_APPLY}/${role.code}`}
                      className="text-primary font-medium hover:underline"
                    >
                      未开通 · 去申请
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
