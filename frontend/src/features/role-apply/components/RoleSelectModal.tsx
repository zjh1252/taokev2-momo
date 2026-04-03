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
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { APPLYABLE_ROLES, type ApplyableRole } from '../api/types';
import { useRoleApplyState } from '../hooks/useRoleApplyState';

const ICON_MAP: Record<string, React.ElementType> = {
  building: Building2,
  graduationCap: GraduationCap,
  userCheck: UserCheck,
  headset: Headset,
  briefcase: Briefcase,
  landmark: Landmark,
  idCard: IdCard,
};

interface RoleSelectModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 角色选择弹窗 — 新用户首次登录后展示
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:30
 */
export function RoleSelectModal({ open, onClose }: RoleSelectModalProps) {
  const router = useRouter();
  const { setSelectedRole, dismiss } = useRoleApplyState();
  const [selected, setSelected] = useState<ApplyableRole | null>(null);

  if (!open) return null;

  const handleSkip = () => {
    dismiss();
    onClose();
  };

  const handleConfirm = () => {
    if (!selected) return;
    setSelectedRole(selected);
    onClose();
    router.push(`${ROUTES.UC_APPLY}/${selected}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-[640px] mx-4 rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">选择您的身份</h2>
            <p className="text-sm text-gray-500 mt-1">
              选择一个角色身份，开启更多专属功能。后续也可在「修改身份」中申请。
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 角色列表 */}
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
          {APPLYABLE_ROLES.map((role) => {
            const Icon = ICON_MAP[role.icon] || Building2;
            const isSelected = selected === role.code;

            return (
              <button
                key={role.code}
                type="button"
                onClick={() => setSelected(role.code)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary bg-red-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center size-10 rounded-lg shrink-0 transition-colors',
                    isSelected
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
                      isSelected ? 'text-primary' : 'text-gray-900',
                    )}
                  >
                    {role.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {role.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部操作区 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            暂时跳过，以后再说
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
  );
}
