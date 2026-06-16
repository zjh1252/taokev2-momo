'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { listManagedTrainers } from '@/features/binding/api/service';
import type { BindingItem } from '@/features/binding/api/types';
import { requiresTrainerBinding } from '@/features/binding/lib/delegating-role';

export interface BoundPublisherGuardResult {
  /** true 表示当前角色需要绑定专家但未绑定 — 应阻止资源发布 */
  blocked: boolean;
  /** 是否仍在加载初始绑定列表 */
  loading: boolean;
  /** 当前可代管的专家列表（仅必须绑定的角色下查询） */
  trainers: BindingItem[];
}

/**
 * 资源发布角色绑定守卫 — 用于资源发布场景的前端拦截。
 *
 * <p>当前激活角色属于「必须绑定专家」角色（AGENT / ASSISTANT / INSTITUTION_EMPLOYEE）时，
 * 调用 {@code listManagedTrainers} 拉取已绑定专家列表；若结果为空则视为未绑定，
 * 业务层应禁止其发布课程 / 案例 / 视频 / 著作等资源并显示提示。其他角色直接返回 blocked=false。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-28 16:30
 */
export function useBoundPublisherGuard(): BoundPublisherGuardResult {
  const { activeRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<BindingItem[]>([]);

  const mustBind = requiresTrainerBinding(activeRole);

  useEffect(() => {
    if (!mustBind) {
      // 非「必须绑定专家」角色无需查询，不直接清空 trainers 以避免触发额外渲染
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
  }, [mustBind]);

  // 当切换到非必须绑定角色时，trainers 状态保持不动；blocked 由 mustBind 控制
  const effectiveTrainers = mustBind ? trainers : [];

  return {
    blocked: mustBind && !loading && effectiveTrainers.length === 0,
    loading,
    trainers: effectiveTrainers,
  };
}
