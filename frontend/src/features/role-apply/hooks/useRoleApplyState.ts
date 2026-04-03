'use client';

import { useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth/auth-context';
import type { ApplyableRole } from '../api/types';

/** 新用户待弹窗标记（短暂跨页面传递用） */
const PENDING_KEY = 'taoke_new_user_pending';

function storageKey(userId: number | undefined) {
  return `taoke_role_apply_${userId ?? 'anon'}`;
}

function dismissedKey(userId: number | undefined) {
  return `taoke_role_apply_dismissed_${userId ?? 'anon'}`;
}

export interface RoleApplyState {
  selectedRole: ApplyableRole | null;
  formData: Record<string, unknown>;
}

/**
 * 角色申请流程状态管理 Hook — 按 userId 隔离持久化到 localStorage
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:00
 */
export function useRoleApplyState() {
  const { user } = useAuth();
  const uid = user?.id;

  const [state, setStateInner] = useState<RoleApplyState>(() => {
    const saved = storage.get<RoleApplyState>(storageKey(uid));
    return saved || { selectedRole: null, formData: {} };
  });

  const persist = useCallback((next: RoleApplyState) => {
    storage.set(storageKey(uid), next);
    setStateInner(next);
  }, [uid]);

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
    storage.remove(storageKey(uid));
    setStateInner({ selectedRole: null, formData: {} });
  }, [uid]);

  const dismiss = useCallback(() => {
    storage.set(dismissedKey(uid), true);
    clearState();
  }, [uid, clearState]);

  const isDismissed = useCallback(() => {
    return !!storage.get<boolean>(dismissedKey(uid));
  }, [uid]);

  return {
    state,
    setSelectedRole,
    setFormData,
    clearState,
    dismiss,
    isDismissed,
  };
}

/** 标记新用户待弹窗（LoginForm 调用） */
export function markNewUserPending() {
  storage.set(PENDING_KEY, true);
}

/** 消费并清除新用户待弹窗标记 */
export function consumeNewUserPending(): boolean {
  const pending = !!storage.get<boolean>(PENDING_KEY);
  if (pending) storage.remove(PENDING_KEY);
  return pending;
}
