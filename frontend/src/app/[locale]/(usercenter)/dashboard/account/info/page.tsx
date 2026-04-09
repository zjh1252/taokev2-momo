'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  BUYER: '个人学员',
  INDIVIDUAL_BUYER: '个人学员',
  ENTERPRISE_BUYER: '企业培训采购方',
  TRAINER: '专家',
  AGENT: '专家经纪人',
  ASSISTANT: '专家助理',
  ENTERPRISE_AGENT: '专家经纪公司',
  INSTITUTION: '培训机构',
  INSTITUTION_EMPLOYEE: '机构员工',
};

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

const STATUS_LABELS: Record<number, { text: string; cls: string }> = {
  1: { text: '生效中', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  2: { text: '待审核', cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  3: { text: '已驳回', cls: 'text-red-600 bg-red-50 border-red-200' },
  4: { text: '已禁用', cls: 'text-gray-500 bg-gray-50 border-gray-200' },
};

/**
 * 身份信息页 — 展示所有已获得角色、当前身份、切换身份功能
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:20
 */
export default function AccountInfoPage() {
  const { user, activeRole, setActiveRole } = useAuth();
  const router = useRouter();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const businessRoles = user?.roles?.filter((r) => !PLATFORM_ROLES.has(r.role)) || [];
  const activeRoles = businessRoles.filter((r) => r.status === 1);
  const allRoles = businessRoles;
  const currentLabel = ROLE_LABELS[activeRole] || '个人学员';

  const switchableRoles = [
    { role: 'BUYER', label: '个人学员' },
    ...activeRoles
      .filter((r) => r.role !== 'BUYER' && r.role !== 'INDIVIDUAL_BUYER')
      .map((r) => ({ role: r.role, label: ROLE_LABELS[r.role] || r.role })),
  ];

  return (
    <>
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold text-gray-900">身份信息</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowSwitchModal(true)}
              className="h-9 px-5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              切换身份
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.UC_ACCOUNT_SWITCH)}
              className="h-9 px-5 rounded-lg border border-slate-200 text-gray-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              修改身份
            </button>
          </div>
        </div>

        {/* 当前身份 */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 rounded-xl p-5 mb-6">
          <div className="text-sm text-gray-500 mb-1">当前身份</div>
          <div className="text-lg font-bold text-primary">{currentLabel}</div>
        </div>

        {/* 所有已获得角色 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-3">已获得角色</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 个人学员始终显示 */}
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">个人学员</span>
                <span className="text-xs px-2 py-0.5 rounded border text-emerald-600 bg-emerald-50 border-emerald-200">
                  生效中
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">默认角色</div>
            </div>

            {allRoles
              .filter((r) => r.role !== 'BUYER' && r.role !== 'INDIVIDUAL_BUYER')
              .map((r) => {
                const statusInfo = STATUS_LABELS[r.status] || STATUS_LABELS[1];
                return (
                  <div
                    key={r.role}
                    className={cn(
                      'border rounded-lg p-4',
                      r.status === 1
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : r.status === 2
                          ? 'border-amber-200 bg-amber-50/50'
                          : 'border-slate-200',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {ROLE_LABELS[r.role] || r.role}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded border',
                          statusInfo.cls,
                        )}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                    {r.approvedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        通过时间：{r.approvedAt}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {allRoles.filter((r) => r.role !== 'BUYER' && r.role !== 'INDIVIDUAL_BUYER').length === 0 && (
            <div className="text-sm text-gray-400 mt-2">
              除默认学员角色外，暂无其他角色。
              <button
                type="button"
                onClick={() => router.push(ROUTES.UC_ACCOUNT_SWITCH)}
                className="text-primary hover:underline ml-1 cursor-pointer"
              >
                去申请角色
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 切换身份弹窗 */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-bold text-gray-900">切换身份</h2>
              <p className="text-sm text-gray-500 mt-1">
                选择要切换到的身份角色
              </p>
            </div>
            <div className="px-6 py-4 space-y-2">
              {switchableRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    setActiveRole(r.role);
                    setShowSwitchModal(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer',
                    activeRole === r.role
                      ? 'border-primary bg-red-50/60 text-primary font-bold'
                      : 'border-slate-200 hover:border-primary/40 hover:bg-red-50/20',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{r.label}</span>
                    {activeRole === r.role && (
                      <span className="text-xs text-primary">当前身份</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer px-4 py-2"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
