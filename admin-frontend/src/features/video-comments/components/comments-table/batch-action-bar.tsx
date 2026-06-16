'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { Table } from '@tanstack/react-table';
import type { AdminVideoComment } from '../../api/types';
import {
  batchApproveVideoComments,
  batchRejectVideoComments,
  batchDeleteVideoComments
} from '../../api/service';
import { videoCommentKeys } from '../../api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BatchActionBarProps {
  table: Table<AdminVideoComment>;
}

export function BatchActionBar({ table }: BatchActionBarProps) {
  const queryClient = useQueryClient();
  const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original.id);

  const invalidate = () => {
    table.resetRowSelection();
    void queryClient.invalidateQueries({ queryKey: videoCommentKeys.all });
  };

  const approveMutation = useMutation({
    mutationFn: () => batchApproveVideoComments(selected),
    onSuccess: () => {
      toast.success('批量通过成功');
      invalidate();
    },
    onError: () => toast.error('批量通过失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => batchRejectVideoComments(selected),
    onSuccess: () => {
      toast.success('批量驳回成功');
      invalidate();
    },
    onError: () => toast.error('批量驳回失败')
  });

  const deleteMutation = useMutation({
    mutationFn: () => batchDeleteVideoComments(selected),
    onSuccess: () => {
      toast.success('批量删除成功');
      invalidate();
    },
    onError: () => toast.error('批量删除失败')
  });

  const pending = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  return (
    <div className='flex items-center gap-2 rounded-lg border bg-muted/50 p-2'>
      <span className='text-muted-foreground text-sm'>已选 {selected.length} 条</span>
      <Button
        size='sm'
        variant='outline'
        disabled={pending}
        onClick={() => approveMutation.mutate()}
      >
        <Icons.check className='mr-1 h-4 w-4' />
        批量通过
      </Button>
      <Button
        size='sm'
        variant='outline'
        disabled={pending}
        onClick={() => rejectMutation.mutate()}
      >
        <Icons.close className='mr-1 h-4 w-4' />
        批量驳回
      </Button>
      <Button
        size='sm'
        variant='destructive'
        disabled={pending}
        onClick={() => deleteMutation.mutate()}
      >
        <Icons.trash className='mr-1 h-4 w-4' />
        批量删除
      </Button>
    </div>
  );
}
