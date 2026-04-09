'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from './auth-context';
import { ROUTES } from '@/config/routes';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface AuthGuardContextValue {
  /** 包装需要登录的操作：已登录则直接执行，未登录弹出确认对话框引导登录 */
  requireAuth: (action: () => void | Promise<void>) => void;
}

const AuthGuardContext = createContext<AuthGuardContextValue | null>(null);

/**
 * 登录守卫 Provider — 为用户主动操作提供统一的未登录拦截
 * <p>
 * 未登录时弹出确认对话框引导用户前往登录页，
 * 已登录时直接执行操作，对调用方完全透明。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-09 15:00
 */
export function AuthGuardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const requireAuth = useCallback(
    (action: () => void | Promise<void>) => {
      if (user) {
        action();
      } else {
        setOpen(true);
      }
    },
    [user],
  );

  const handleGoLogin = useCallback(() => {
    setOpen(false);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthGuardContext.Provider value={{ requireAuth }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>需要登录</AlertDialogTitle>
            <AlertDialogDescription>
              您尚未登录，是否前往登录页面？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoLogin}>
              前往登录
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuardContext.Provider>
  );
}

/**
 * 获取登录守卫的 Hook
 * <p>必须在 AuthGuardProvider 内部使用</p>
 */
export function useAuthGuard(): AuthGuardContextValue {
  const ctx = useContext(AuthGuardContext);
  if (!ctx) {
    throw new Error('useAuthGuard 必须在 AuthGuardProvider 内部使用');
  }
  return ctx;
}
