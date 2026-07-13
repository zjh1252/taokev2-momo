'use client';

import { CartBadge } from '@/features/cart/components/CartBadge';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import { UserAuthArea } from './header-auth';

type HeaderUserActionsProps = {
  className?: string;
};

export function HeaderUserActions({ className }: HeaderUserActionsProps) {
  const { user, loading } = useAuth();

  return (
    <div className={cn('flex items-center gap-3 text-slate-500 text-xs', className)}>
      {!loading && user && (
        <>
          <CartBadge />
          <span className="text-slate-300">|</span>
          <NotificationBell />
          <span className="text-slate-300">|</span>
        </>
      )}
      <UserAuthArea />
    </div>
  );
}
