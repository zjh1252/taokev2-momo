'use client';

import {
  useBoundPublisherGuard,
  type BoundPublisherGuardResult,
} from '@/features/binding/hooks/useBoundPublisherGuard';

export type AssistantBindingGuardResult = BoundPublisherGuardResult;

/**
 * @deprecated 改用 {@link useBoundPublisherGuard}，本 hook 保留为兼容别名。
 *
 * 资源发布角色绑定守卫 — 当前激活角色属于「必须绑定专家」角色（AGENT /
 * ASSISTANT / INSTITUTION_EMPLOYEE）且未绑定任何专家时，blocked=true。
 */
export function useAssistantBindingGuard(): AssistantBindingGuardResult {
  return useBoundPublisherGuard();
}
