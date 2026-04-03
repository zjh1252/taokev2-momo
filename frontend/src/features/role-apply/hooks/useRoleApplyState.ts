'use client';

import { useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import type { ApplyableRole } from '../api/types';

const STORAGE_KEY = 'taoke_role_apply';
const DISMISSED_KEY = 'taoke_role_apply_dismissed';

export interface RoleApplyState {
  selectedRole: ApplyableRole | null;
  formData: Record<string, unknown>;
}

/**
 * 角色申请流程状态管理 Hook — 持久化到 localStorage
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:00
 */
export function useRoleApplyState() {
  const [state, setStateInner] = useState<RoleApplyState>(() => {
    const saved = storage.get<RoleApplyState>(STORAGE_KEY);
    return saved || { selectedRole: null, formData: {} };
  });

  const persist = useCallback((next: RoleApplyState) => {
    storage.set(STORAGE_KEY, next);
    setStateInner(next);
  }, []);

  const setSelectedRole = useCallback(
    (role: ApplyableRole) => {
      persist({ ...state, selectedRole: role, formData: {} });
    },
    [state, persist],
  );

  const setFormData = useCallback(
    (data: Record<string, unknown>) => {
      persist({ ...state, formData: data });
    },
    [state, persist],
  );

  const clearState = useCallback(() => {
    storage.remove(STORAGE_KEY);
    setStateInner({ selectedRole: null, formData: {} });
  }, []);

  const dismiss = useCallback(() => {
    storage.set(DISMISSED_KEY, true);
    clearState();
  }, [clearState]);

  const isDismissed = useCallback(() => {
    return !!storage.get<boolean>(DISMISSED_KEY);
  }, []);

  return {
    state,
    setSelectedRole,
    setFormData,
    clearState,
    dismiss,
    isDismissed,
  };
}
