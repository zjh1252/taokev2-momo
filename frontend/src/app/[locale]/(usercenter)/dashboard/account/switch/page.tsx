'use client';

import { useRouter } from 'next/navigation';
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
import { type ApplyableRole } from '@/features/role-apply/api/types';
import { useRoleApplyState } from '@/features/role-apply/hooks/useRoleApplyState';

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
 * 修改身份页 — 展示角色列表 + 弹窗选择申请
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:30
 */
export default function AccountSwitchPage() {
  const { user, activeRole, setActiveRole } = useAuth();
  const router = useRouter();
  const { setSelectedRole } = useRoleApplyState();

  const roleStatusMap = new Map(
    user?.roles?.map((r) => [r.role, r.status]) || [],
  );
  // 个人学员始终标记为已生效
  roleStatusMap.set('BUYER', 1);

  // 可申请的角色编码集合
  const applyableRoleCodes = new Set([
    'ENTERPRISE_BUYER',
    'TRAINER',
    'AGENT',
    'ASSISTANT',
    'ENTERPRISE_AGENT',
    'INSTITUTION',
    'INSTITUTION_EMPLOYEE',
  ]);

  const handleRoleClick = (roleCode: string) => {
    const status = roleStatusMap.get(roleCode);
    const isActive = status === 1;

    if (isActive) {
      // 已拥有该角色，直接切换
      setActiveRole(roleCode);
    } else if (applyableRoleCodes.has(roleCode)) {
      // 未拥有但可申请，跳转到申请页面
      setSelectedRole(roleCode as ApplyableRole);
      router.push(`${ROUTES.UC_APPLY}/${roleCode}`);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div>
        <div className="text-xl font-bold text-gray-900">修改身份</div>
        <div className="text-sm text-gray-500 mt-2">
          点击角色可切换身份或申请新角色。
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        {ALL_ROLES.filter(role => !('adminOnly' in role && role.adminOnly)).map((role) => {
          const status = roleStatusMap.get(role.code);
          const isActive = status === 1;
          const isPending = status === 2;
          const isRejected = status === 3;
          const isAdmin = 'adminOnly' in role && role.adminOnly;
          const isCurrent = activeRole === role.code;
          const isClickable = isActive || applyableRoleCodes.has(role.code);
          const Icon = role.icon;

          return (
            <div
              key={role.code}
              onClick={() => isClickable && handleRoleClick(role.code)}
              className={cn(
                'border rounded-xl p-4 transition-all flex items-start gap-3',
                isCurrent
                  ? 'border-primary/40 bg-red-50/60 ring-1 ring-primary/20'
                  : isActive
                    ? 'border-primary/30 bg-red-50/40'
                    : isPending
                      ? 'border-amber-200 bg-amber-50/40'
                      : isRejected
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-slate-200',
                isClickable && 'cursor-pointer hover:shadow-sm',
                isClickable && !isActive && 'hover:border-primary/40 hover:bg-red-50/30',
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
                <div className="mt-2 text-xs flex items-center gap-2">
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      已生效
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <span className="size-1.5 rounded-full bg-primary" />
                      当前身份
                    </span>
                  )}
                  {isActive && !isCurrent && (
                    <span className="text-primary hover:underline">
                      点击切换
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      审核中
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <span className="size-1.5 rounded-full bg-red-500" />
                      已驳回
                    </span>
                  )}
                  {!isActive && !isPending && !isRejected && applyableRoleCodes.has(role.code) && (
                    <span className="text-primary hover:underline">
                      点击申请
                    </span>
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
