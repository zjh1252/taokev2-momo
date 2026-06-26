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
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { APPLYABLE_ROLES, type ApplyableRole } from '@/features/role-apply/api/types';
import { useRoleApplyState } from '@/features/role-apply/hooks/useRoleApplyState';
import { useAuth } from '@/lib/auth/auth-context';

const ICON_MAP: Record<string, React.ElementType> = {
  building: Building2,
  graduationCap: GraduationCap,
  userCheck: UserCheck,
  headset: Headset,
  briefcase: Briefcase,
  landmark: Landmark,
  idCard: IdCard,
};

/**
 * 角色选择页 — 用户在此选择要申请的角色
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:30
 */
export default function ApplySelectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedRole } = useRoleApplyState();
  const [selected, setSelected] = useState<ApplyableRole | null>(null);

  const activeRoleCodes = new Set(
    user?.roles?.filter((r) => r.status === 1 || r.status === 2).map((r) => r.role) || [],
  );

  const handleConfirm = () => {
    if (!selected) return;
    setSelectedRole(selected);
    router.push(`${ROUTES.UC_APPLY}/${selected}`);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px]">
      {/* 步骤条 */}
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-gray-900 mb-1">选择要申请的身份角色</h2>
        <p className="text-sm text-gray-500">
          请选择一个角色身份进行申请。不同角色将拥有不同的平台功能权限。
        </p>
        <div className="flex items-center gap-0 mt-4">
          {['选择角色', '填写资料', '提交完成'].map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center size-7 rounded-full text-xs font-bold',
                    idx === 0 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500',
                  )}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    idx === 0 ? 'text-gray-900' : 'text-gray-400',
                  )}
                >
                  {step}
                </span>
              </div>
              {idx < 2 && <div className="w-16 h-[2px] mx-3 bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      {/* 角色卡片 */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPLYABLE_ROLES.map((role) => {
          const Icon = ICON_MAP[role.icon] || Building2;
          const isSelected = selected === role.code;
          const alreadyApplied = activeRoleCodes.has(role.code);

          return (
            <button
              key={role.code}
              type="button"
              disabled={alreadyApplied}
              onClick={() => setSelected(role.code)}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                alreadyApplied
                  ? 'border-green-200 bg-green-50/50 opacity-60 cursor-not-allowed'
                  : isSelected
                    ? 'border-primary bg-red-50/60 shadow-sm cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center size-10 rounded-lg shrink-0 transition-colors',
                  alreadyApplied
                    ? 'bg-green-100 text-green-600'
                    : isSelected
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-500',
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    'font-semibold text-sm',
                    alreadyApplied
                      ? 'text-green-700'
                      : isSelected
                        ? 'text-primary'
                        : 'text-gray-900',
                  )}
                >
                  {role.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {alreadyApplied ? '已申请/已开通' : role.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100">
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
    </section>
  );
}
