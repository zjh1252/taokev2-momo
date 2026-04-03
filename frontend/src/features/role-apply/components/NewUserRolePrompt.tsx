'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { consumeNewUserPending } from '../hooks/useRoleApplyState';
import { RoleSelectModal } from './RoleSelectModal';

/**
 * 全局新用户角色选择提示 — 挂载后检测 pending 标记，延迟弹出 Modal。
 * 放在 Providers 中，确保页面跳转完成后才展示。
 *
 * @author Fangxinxin
 * @date 2026-04-03 17:00
 */
export function NewUserRolePrompt() {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    const pending = consumeNewUserPending();
    if (!pending) return;

    const timer = setTimeout(() => setShowModal(true), 500);
    return () => clearTimeout(timer);
  }, [loading, user]);

  if (!showModal) return null;

  return (
    <RoleSelectModal
      open={showModal}
      onClose={() => setShowModal(false)}
    />
  );
}
