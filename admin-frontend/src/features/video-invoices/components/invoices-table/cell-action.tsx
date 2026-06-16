'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { AdminVideoInvoice } from '../../api/types';
import { issueVideoInvoice, rejectVideoInvoice } from '../../api/service';
import { videoInvoiceKeys } from '../../api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CellActionProps {
  data: AdminVideoInvoice;
}

export function CellAction({ data }: CellActionProps) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: videoInvoiceKeys.all });
  };

  const issueMutation = useMutation({
    mutationFn: () => issueVideoInvoice(data.id),
    onSuccess: () => {
      toast.success('开票成功');
      invalidate();
    },
    onError: () => toast.error('开票失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectVideoInvoice(data.id),
    onSuccess: () => {
      toast.success('已驳回');
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const canIssue = data.status === 'PENDING' || data.status === 'PROCESSING';
  const canReject = data.status === 'PENDING' || data.status === 'PROCESSING';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>打开菜单</span>
          <Icons.ellipsis className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        {canIssue && (
          <DropdownMenuItem onClick={() => issueMutation.mutate()}>
            <Icons.check className='mr-2 h-4 w-4' />
            开票
          </DropdownMenuItem>
        )}
        {canReject && (
          <DropdownMenuItem onClick={() => rejectMutation.mutate()}>
            <Icons.close className='mr-2 h-4 w-4' />
            驳回
          </DropdownMenuItem>
        )}
        {!canIssue && !canReject && (
          <DropdownMenuItem disabled>
            <Icons.info className='mr-2 h-4 w-4' />
            无可用操作
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
