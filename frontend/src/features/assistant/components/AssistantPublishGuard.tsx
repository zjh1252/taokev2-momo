'use client';

import type { ReactNode } from 'react';
import { useAssistantBindingGuard } from '../hooks/useAssistantBindingGuard';
import { AssistantUnboundBanner } from './AssistantUnboundBanner';

/**
 * 资源发布页守卫包装 — 当当前角色为 ASSISTANT 且未绑定任何专家时，
 * 直接以「未绑定专家」横幅占位整个表单区域；其它角色 / 已绑定时
 * 透传 children。
 *
 * <p>使用方式：在 create / edit 页里把表单部分包到本组件内即可，
 * 不影响标题栏、面包屑等。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 16:00
 */
export function AssistantPublishGuard({ children }: { children: ReactNode }) {
  const { blocked, loading } = useAssistantBindingGuard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full size-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (blocked) {
    return <AssistantUnboundBanner />;
  }

  return <>{children}</>;
}
