'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { meQueryOptions } from '@/features/auth/api/queries';
import { logoutMutation } from '@/features/auth/api/mutations';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { ChangePasswordDialog } from '@/features/auth/components/change-password-dialog';
import { useEffect, useState } from 'react';

export function UserNav() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [pwdOpen, setPwdOpen] = useState(false);

  const { data } = useQuery(meQueryOptions());

  const user = data?.data ?? null;

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  const { mutate: doLogout } = useMutation({
    ...logoutMutation,
    onSuccess: () => {
      setUser(null);
      toast.success('已退出登录');
      router.replace('/login');
    }
  });

  if (!user) {
    return (
      <Button variant='outline' size='sm' onClick={() => router.push('/login')}>
        登录
      </Button>
    );
  }

  const displayName = user.nickname || user.phone;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-muted-foreground text-xs leading-none'>{user.phone}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setPwdOpen(true);
          }}
        >
          修改密码
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => doLogout()}>退出登录</DropdownMenuItem>
      </DropdownMenuContent>
      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
    </DropdownMenu>
  );
}
