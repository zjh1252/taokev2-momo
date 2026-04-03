'use client';

import { useAuth } from '@/lib/auth/auth-context';

const ROLE_LABELS: Record<string, string> = {
  BUYER: '学员（INDIVIDUAL_BUYER）',
  INDIVIDUAL_BUYER: '学员（INDIVIDUAL_BUYER）',
  ENTERPRISE_BUYER: '企业甲方（ENTERPRISE_BUYER）',
  TRAINER: '讲师（TRAINER）',
  AGENT: '讲师经纪人（AGENT）',
  INSTITUTION: '机构（INSTITUTION）',
  INSTITUTION_EMPLOYEE: '机构员工',
  SUPER_ADMIN: '超级管理员',
};

const STATUS_LABELS: Record<number, { text: string; cls: string }> = {
  1: { text: '生效中', cls: 'text-emerald-600' },
  2: { text: '待审核', cls: 'text-amber-600' },
  3: { text: '已驳回', cls: 'text-red-600' },
  4: { text: '已禁用', cls: 'text-gray-500' },
};

/**
 * 身份信息页 — 展示当前用户身份角色、注册时间、角色状态（接入 /users/me）
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:20
 */
export default function AccountInfoPage() {
  const { user } = useAuth();

  const activeRole = user?.roles?.find((r) => r.status === 1);
  const roleLabel =
    ROLE_LABELS[activeRole?.role || 'BUYER'] || activeRole?.role || '学员';
  const statusInfo = STATUS_LABELS[activeRole?.status || 1] || STATUS_LABELS[1];

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">身份信息</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="text-gray-500">当前身份</div>
          <div className="mt-1 font-medium">{roleLabel}</div>
        </div>
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="text-gray-500">注册时间</div>
          <div className="mt-1 font-medium">
            {/* createdAt 从 AuthUser 暂不可用，先用 TODO */}
            {/* TODO: 从完整 UserProfileResponse 获取 createdAt */}
            2024-08-06
          </div>
        </div>
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="text-gray-500">角色状态</div>
          <div className={`mt-1 font-medium ${statusInfo.cls}`}>
            {statusInfo.text}
          </div>
        </div>
      </div>
    </section>
  );
}
