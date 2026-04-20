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
  Pencil,
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

const ROLE_LABELS: Record<string, string> = {
  BUYER: '个人学员',
  ENTERPRISE_BUYER: '企业培训采购方',
  TRAINER: '专家',
  AGENT: '专家经纪人',
  ASSISTANT: '专家助理',
  ENTERPRISE_AGENT: '专家经纪公司',
  INSTITUTION: '培训机构',
  INSTITUTION_EMPLOYEE: '机构员工',
};

const applyableRoleCodes = new Set([
  'ENTERPRISE_BUYER',
  'TRAINER',
  'AGENT',
  'ASSISTANT',
  'ENTERPRISE_AGENT',
  'INSTITUTION',
  'INSTITUTION_EMPLOYEE',
]);

/**
 * 修改身份页 — 显示当前身份、切换身份、申请新角色、修改角色资料
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
  roleStatusMap.set('BUYER', 1);

  const handleSwitch = (roleCode: string) => {
    setActiveRole(roleCode);
  };

  const handleApply = (roleCode: string) => {
    setSelectedRole(roleCode as ApplyableRole);
    router.push(`${ROUTES.UC_APPLY}/${roleCode}`);
  };

  const handleEditProfile = (roleCode: string) => {
    setSelectedRole(roleCode as ApplyableRole);
    router.push(`${ROUTES.UC_APPLY}/${roleCode}`);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="text-xl font-bold text-gray-900">修改身份</div>
        <div className="text-sm text-gray-500 mt-2">
          管理你的角色身份：切换当前身份、申请新角色或修改角色资料。
        </div>
      </div>

      {/* 当前身份展示 */}
      <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 rounded-xl p-5 mb-6">
        <div className="text-sm text-gray-500 mb-1">当前身份</div>
        <div className="text-lg font-bold text-primary">{ROLE_LABELS[activeRole] || '个人学员'}</div>
      </div>

      {/* 角色卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ALL_ROLES.filter(role => !('adminOnly' in role && role.adminOnly)).map((role) => {
          const status = roleStatusMap.get(role.code);
          const isActive = status === 1;
          const isPending = status === 2;
          const isRejected = status === 3;
          const isCurrent = activeRole === role.code;
          const canEditProfile = isActive && role.code !== 'BUYER' && applyableRoleCodes.has(role.code);
          const Icon = role.icon;

          return (
            <div
              key={role.code}
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
                <div className="mt-2 text-xs flex items-center gap-2 flex-wrap">
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
                    <button
                      type="button"
                      onClick={() => handleSwitch(role.code)}
                      className="text-primary hover:underline font-medium cursor-pointer"
                    >
                      点击切换
                    </button>
                  )}
                  {canEditProfile && (
                    <button
                      type="button"
                      onClick={() => handleEditProfile(role.code)}
                      className="inline-flex items-center gap-1 text-gray-500 hover:text-primary font-medium cursor-pointer"
                    >
                      <Pencil className="size-3" />
                      修改角色资料
                    </button>
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
                    <button
                      type="button"
                      onClick={() => handleApply(role.code)}
                      className="text-primary hover:underline font-medium cursor-pointer"
                    >
                      点击申请
                    </button>
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
