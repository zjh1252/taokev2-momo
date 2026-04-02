'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { updateUserStatusMutation } from '../../api/mutations';
import type { User } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AssignRolesDialog } from '../assign-roles-dialog';

interface CellActionProps {
  data: User;
}

export function CellAction({ data }: CellActionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);

  const isFrozen = data.status === 2;
  const nextStatus = isFrozen ? 1 : 2;
  const actionLabel = isFrozen ? '解冻' : '冻结';

  const statusMutation = useMutation({
    ...updateUserStatusMutation,
    onSuccess: () => {
      toast.success(`${actionLabel}成功`);
      setConfirmOpen(false);
    },
    onError: () => {
      toast.error(`${actionLabel}失败`);
    }
  });

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          statusMutation.mutate({
            id: data.id,
            payload: { status: nextStatus }
          })
        }
        loading={statusMutation.isPending}
      />
      <AssignRolesDialog
        user={data}
        open={rolesDialogOpen}
        onOpenChange={setRolesDialogOpen}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setRolesDialogOpen(true)}>
            <Icons.settings className='mr-2 h-4 w-4' />
            授权角色
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
            {isFrozen ? (
              <Icons.check className='mr-2 h-4 w-4' />
            ) : (
              <Icons.close className='mr-2 h-4 w-4' />
            )}
            {actionLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
