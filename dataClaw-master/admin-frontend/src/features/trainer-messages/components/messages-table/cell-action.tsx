'use client';
import Link from 'next/link';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminTrainerMessage } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { markTrainerMessageProcessed } from '../../api/service';
import { trainerMessageKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminTrainerMessage;
}

export function CellAction({ data }: CellActionProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const isProcessed = data.status === 2;

  const processMutation = useMutation({
    mutationFn: () => markTrainerMessageProcessed(data.id),
    onSuccess: () => {
      toast.success('已标记为已处理');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: trainerMessageKeys.all });
    },
    onError: () => toast.error('操作失败'),
  });

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => processMutation.mutate()}
        loading={processMutation.isPending}
        title='标记为已处理'
        description={`确定将「${data.trainingTopic}」的留言标记为已处理吗？`}
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
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/trainer-messages/${data.id}`}>
              <Icons.info className='mr-2 h-4 w-4' />
              查看详情
            </Link>
          </DropdownMenuItem>
          {!isProcessed && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Icons.check className='mr-2 h-4 w-4' />
                标记已处理
              </DropdownMenuItem>
            </>
          )}
          {isProcessed && (
            <DropdownMenuItem disabled>
              <Icons.checks className='mr-2 h-4 w-4' />
              已处理
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
