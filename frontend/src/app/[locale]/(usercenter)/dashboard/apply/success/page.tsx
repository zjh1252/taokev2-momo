'use client';

import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { APPLYABLE_ROLES, type ApplyableRole } from '@/features/role-apply/api/types';

/**
 * 角色申请提交成功页
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:30
 */
export default function ApplySuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleCode = (searchParams.get('role') || '').toUpperCase() as ApplyableRole;
  const roleMeta = APPLYABLE_ROLES.find((r) => r.code === roleCode);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px]">
      {/* 步骤条 */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">角色申请</span>
          {roleMeta && (
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
              {roleMeta.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0">
          {['选择角色', '填写资料', '提交完成'].map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-7 rounded-full text-xs font-bold bg-primary text-white">
                  {idx < 2 ? '✓' : idx + 1}
                </div>
                <span className="text-sm font-medium text-gray-900">{step}</span>
              </div>
              {idx < 2 && <div className="w-16 h-[2px] mx-3 bg-primary" />}
            </div>
          ))}
        </div>
      </div>

      {/* 成功内容 */}
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="flex items-center justify-center size-20 rounded-full bg-green-50 mb-6">
          <CheckCircle className="size-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">资料已提交，正在审核中</h2>
        <p className="text-gray-500 text-center max-w-md mb-2">
          您申请的
          <span className="font-semibold text-primary">
            「{roleMeta?.label || roleCode}」
          </span>
          身份资料已成功提交。
        </p>
        {roleMeta?.needsReview ? (
          <p className="text-gray-500 text-center max-w-md mb-8">
            我们的工作人员将在 <span className="font-semibold">1-3 个工作日</span> 内完成审核，
            届时会通过站内消息通知您审核结果。
          </p>
        ) : (
          <p className="text-gray-500 text-center max-w-md mb-8">
            您的身份已生效，可直接使用相应功能。
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-medium text-gray-600 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Home className="size-4" />
            <span>返回用户中心</span>
          </button>
          <button
            type="button"
            onClick={() => router.push(ROUTES.UC_ACCOUNT_SWITCH)}
            className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
          >
            <span>查看身份状态</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
