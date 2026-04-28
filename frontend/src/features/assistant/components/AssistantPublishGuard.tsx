'use client';

import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

/**
 * @deprecated 改用 {@link BoundPublisherGuard}，本组件保留为兼容别名。
 *
 * 资源发布页守卫包装 — 当前角色为必须绑定专家的角色（AGENT /
 * ASSISTANT / INSTITUTION_EMPLOYEE）且未绑定时，以「未绑定专家」横幅
 * 替换整个表单区域。
 */
export const AssistantPublishGuard = BoundPublisherGuard;
