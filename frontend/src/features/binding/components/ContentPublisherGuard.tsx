'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { canPublishContent } from '@/features/binding/lib/delegating-role';

/**
 * 内容发布权限守卫 — 仅 6 个内容角色（专家/经纪人/助理/经纪公司/机构/机构员工）
 * 可发布课程、案例等资源；个人学员等其它激活角色直接以「无权限」卡片占位整个表单区域。
 *
 * <p>判定基于「当前激活角色」，与侧边栏内容菜单及后端 {@code @RequireRole} 保持一致。</p>
 *
 * @author Fangxinxin
 * @date 2026-06-02 10:00
 */
export function ContentPublisherGuard({
  children,
  resourceLabel = '资源',
}: {
  children: ReactNode;
  resourceLabel?: string;
}) {
  const { activeRole } = useAuth();

  if (!canPublishContent(activeRole)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Lock className="size-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-amber-900">
              当前身份无法发布{resourceLabel}
            </h3>
            <p className="mt-1 text-sm text-amber-800/90">
              仅专家、专家助理、专家经纪人、专家经纪公司、机构、机构员工可发布{resourceLabel}。
              请切换到对应身份，或先申请成为供给方角色。
            </p>
            <Link
              href="/dashboard/apply"
              className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors px-4 py-2 text-sm font-medium text-white"
            >
              去申请角色
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
