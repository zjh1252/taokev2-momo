'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { listManagedTrainers } from '@/features/binding/api/service';
import type { BindingItem } from '@/features/binding/api/types';

export interface AssistantBindingGuardResult {
  /** true 表示当前角色是 ASSISTANT，但没有任何已绑定的专家 — 应阻止资源发布。 */
  blocked: boolean;
  /** 是否仍在加载初始绑定列表 */
  loading: boolean;
  /** 当前可代管的专家列表（仅 ASSISTANT 角色下查询） */
  trainers: BindingItem[];
}

/**
 * 专家助理绑定守卫 — 用于资源发布场景的前端拦截。
 *
 * <p>当前激活角色为 ASSISTANT 时，调用 {@code listManagedTrainers} 拉取已绑定专家列表；
 * 若结果为空则视为「未绑定专家」，业务层应禁止其发布课程 / 案例 / 视频 / 著作等资源
 * 并显示提示与「去添加专家」CTA。其他角色直接返回 blocked=false。</p>
 *
 * <p>本守卫仅做前端提示，后端硬校验由 binding 授权服务后续补充。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 16:00
 */
export function useAssistantBindingGuard(): AssistantBindingGuardResult {
  const { activeRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<BindingItem[]>([]);

  const isAssistant = activeRole === 'ASSISTANT';

  useEffect(() => {
    if (!isAssistant) {
      setTrainers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listManagedTrainers()
      .then((list) => {
        if (!cancelled) setTrainers(list || []);
      })
      .catch(() => {
        if (!cancelled) setTrainers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAssistant]);

  return {
    blocked: isAssistant && !loading && trainers.length === 0,
    loading,
    trainers,
  };
}
