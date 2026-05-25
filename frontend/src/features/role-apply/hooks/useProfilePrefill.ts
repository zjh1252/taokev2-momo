'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * 判断某个字段值是否为「空」—— 空字符串 / null / undefined / 空数组都算空。
 */
function isFieldEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * 智能合并：profile 优先，但 profile 中为「空」的字段使用 data 的非空值兜底。
 * <p>解决场景：useRoleApplyState 在 setSelectedRole 时把 formData 初始化为
 * defaultFormData（全是空字符串/null）。直接 {@code {...profile, ...data}} 会让
 * data 的空字符串覆盖 profile 的真实值；反过来 {@code {...data, ...profile}} 又
 * 会丢失 data 中用户已编辑的非空字段（如自动回填的 contactPhone）。</p>
 */
function smartMerge<T extends object>(
  profile: Partial<T>,
  data: Partial<T>,
): Partial<T> {
  const merged: Partial<T> = { ...profile };
  for (const key of Object.keys(data) as Array<keyof T>) {
    const dataValue = data[key];
    if (isFieldEmpty(dataValue)) continue;
    const profileValue = profile[key];
    if (isFieldEmpty(profileValue)) {
      merged[key] = dataValue;
    }
  }
  return merged;
}

/**
 * 通用「修改资料」自动回填 Hook。
 *
 * <p>逻辑：</p>
 * <ol>
 *   <li>用户已生效（status=1）当前角色时，调用 fetcher 拉取后端档案</li>
 *   <li>仅当 store 中 data 视为「空」时才回填（避免覆盖用户已编辑的内容）</li>
 *   <li>整页生命周期内只拉一次（用 ref 守卫，避免重复请求）</li>
 *   <li>合并策略：profile 字段优先，仅在 profile 该字段为空时使用 data 的非空兜底
 *       （处理 contactPhone 等自动注入字段）</li>
 * </ol>
 *
 * @author Fangxinxin
 * @date 2026-05-20 21:00
 */
export function useProfilePrefill<T extends object>({
  role,
  data,
  onChange,
  fetcher,
  isEmpty,
}: {
  role: string;
  data: Partial<T>;
  onChange: (data: Partial<T>) => void;
  fetcher: () => Promise<Partial<T> | null>;
  isEmpty: (d: Partial<T>) => boolean;
}) {
  const { user } = useAuth();
  const loadedRef = useRef(false);
  // 用 ref 持续承接最新的 data，避免 useEffect 依赖 data 带来的循环触发
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (loadedRef.current) return;
    // user 还未加载完，先静默等待 — user.roles 一旦变化会重新触发本 effect
    if (!user?.roles) return;
    const hasActive = user.roles.some(
      (r) => r.role === role && r.status === 1,
    );
    if (!hasActive) return;
    if (!isEmpty(dataRef.current)) return;

    loadedRef.current = true;
    fetcher()
      .then((profile) => {
        if (!profile) return;
        onChange(smartMerge(profile, dataRef.current));
      })
      .catch(() => {
        // 静默：等同空白表单
      });
  }, [user?.roles, role]); // eslint-disable-line react-hooks/exhaustive-deps
}
