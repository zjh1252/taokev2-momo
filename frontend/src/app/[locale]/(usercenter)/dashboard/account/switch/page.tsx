'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

const ALL_ROLES = [
  { code: 'BUYER', label: 'INDIVIDUAL_BUYER（个人甲方）' },
  { code: 'ENTERPRISE_BUYER', label: 'ENTERPRISE_BUYER（企业甲方）' },
  { code: 'TRAINER', label: 'TRAINER（讲师）' },
  { code: 'AGENT', label: 'AGENT（讲师经纪人）' },
  { code: 'INSTITUTION', label: 'ORGANIZATION（机构）' },
  {
    code: '_ADMIN',
    label: 'FRONTEND_CS / BACKEND_CS / SUPER_ADMIN',
    adminOnly: true,
  },
] as const;

/**
 * 修改身份页 — 展示角色列表、当前角色高亮、未开通可申请（接入 /users/me roles）
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:30
 */
export default function AccountSwitchPage() {
  const { user } = useAuth();
  const activeRoleCodes = new Set(
    user?.roles?.filter((r) => r.status === 1).map((r) => r.role) || [],
  );

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">修改身份</div>
      <div className="text-sm text-gray-500 mt-2">
        可基于角色体系切换当前身份视角，未开通角色可发起申请。
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        {ALL_ROLES.map((role) => {
          const isActive = activeRoleCodes.has(role.code);
          const isAdmin = 'adminOnly' in role && role.adminOnly;

          return (
            <button
              key={role.code}
              type="button"
              className={cn(
                'border rounded-lg p-4 text-left transition-colors',
                isActive
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div
                className={cn(
                  'font-medium',
                  isActive && 'text-primary',
                )}
              >
                {role.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {isActive
                  ? '当前身份'
                  : isAdmin
                    ? '运营角色，仅后台创建'
                    : '未开通 · 去申请'}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
