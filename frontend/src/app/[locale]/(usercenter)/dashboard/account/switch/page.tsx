'use client';

import { useState } from 'react';
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
  ArrowRight,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { APPLYABLE_ROLES, type ApplyableRole } from '@/features/role-apply/api/types';
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
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<ApplyableRole | null>(null);

  const roleStatusMap = new Map(
    user?.roles?.map((r) => [r.role, r.status]) || [],
  );
  // 个人学员始终标记为已生效
  roleStatusMap.set('BUYER', 1);

  const handleApplyClick = () => {
    setSelected(null);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setSelectedRole(selected);
    setShowModal(false);
    router.push(`${ROUTES.UC_APPLY}/${selected}`);
  };

  return (
    <>
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">修改身份</div>
            <div className="text-sm text-gray-500 mt-2">
              可基于角色体系切换当前身份视角，未开通角色可发起申请。
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyClick}
            className="h-9 px-5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            申请新角色
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          {ALL_ROLES.filter(role => !('adminOnly' in role && role.adminOnly)).map((role) => {
            const status = roleStatusMap.get(role.code);
            const isActive = status === 1;
            const isPending = status === 2;
            const isRejected = status === 3;
            const isAdmin = 'adminOnly' in role && role.adminOnly;
            const isCurrent = activeRole === role.code;
            const Icon = role.icon;

            return (
              <div
                key={role.code}
                className={cn(
                  'border rounded-xl p-4 transition-colors flex items-start gap-3',
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
                      <button
                        type="button"
                        onClick={() => setActiveRole(role.code)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        切换到此身份
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
                    {isAdmin && (
                      <span className="text-gray-400">运营角色，仅后台创建</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 角色申请弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-[640px] mx-4 rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">选择要申请的角色</h2>
                <p className="text-sm text-gray-500 mt-1">
                  已获得的角色无法重复申请
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {APPLYABLE_ROLES.map((role) => {
                const status = roleStatusMap.get(role.code);
                const isOwned = status === 1 || status === 2;
                const isSelected = selected === role.code;

                return (
                  <button
                    key={role.code}
                    type="button"
                    disabled={isOwned}
                    onClick={() => setSelected(role.code)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200',
                      isOwned
                        ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary bg-red-50/60 shadow-md scale-[1.02] cursor-pointer'
                          : 'border-slate-200 hover:border-primary/40 hover:bg-red-50/30 hover:shadow-sm hover:scale-[1.01] cursor-pointer',
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center size-10 rounded-lg shrink-0 transition-all duration-200',
                        isOwned
                          ? 'bg-green-100 text-green-500'
                          : isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {isOwned ? <CheckCircle className="size-5" /> : (
                        (() => {
                          const ICON_MAP: Record<string, React.ElementType> = {
                            building: Building2,
                            graduationCap: GraduationCap,
                            userCheck: UserCheck,
                            headset: Headset,
                            briefcase: Briefcase,
                            landmark: Landmark,
                            idCard: IdCard,
                          };
                          const Icon = ICON_MAP[role.icon] || Building2;
                          return <Icon className="size-5" />;
                        })()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          'font-semibold text-sm transition-colors duration-200',
                          isOwned
                            ? 'text-gray-400'
                            : isSelected
                              ? 'text-primary'
                              : 'text-gray-900',
                        )}
                      >
                        {role.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {isOwned
                          ? (status === 1 ? '您已获得该角色' : '审核中')
                          : role.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selected}
                className={cn(
                  'h-10 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all',
                  selected
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                )}
              >
                <span>下一步，填写资料</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
