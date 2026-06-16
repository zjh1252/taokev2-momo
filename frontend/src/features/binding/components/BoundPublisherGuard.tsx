'use client';

import type { ReactNode } from 'react';
import {
  useBoundPublisherGuard,
  type BoundPublisherGuardOptions,
} from '../hooks/useBoundPublisherGuard';
import { UnboundPublisherBanner } from './UnboundPublisherBanner';

/**
 * 资源发布页守卫包装 — 当当前角色属于「必须绑定专家」角色（AGENT /
 * ASSISTANT / INSTITUTION_EMPLOYEE）且未绑定任何专家时，直接以「未绑定专家」
 * 横幅占位整个表单区域；其它角色 / 已绑定时透传 children。
 *
 * <p>使用方式：在 create / edit 页里把表单部分包到本组件内即可，不影响标题栏、面包屑等。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-28 16:30
 */
export function BoundPublisherGuard({
  children,
  options,
}: {
  children: ReactNode;
  options?: BoundPublisherGuardOptions;
}) {
  const { blocked, loading } = useBoundPublisherGuard(options);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full size-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (blocked) {
    return <UnboundPublisherBanner />;
  }

  return <>{children}</>;
}
