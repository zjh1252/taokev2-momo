'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { NewUserRolePrompt } from '@/features/role-apply/components/NewUserRolePrompt';
import { Toaster } from '@/components/ui/sonner';

/**
 * 客户端 Providers 聚合组件
 * <p>用于在 Server Component layout 中注入所有需要的 Client Context</p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 22:10
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <NewUserRolePrompt />
      <Toaster />
    </AuthProvider>
  );
}
