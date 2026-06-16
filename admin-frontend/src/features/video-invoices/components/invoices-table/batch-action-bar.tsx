'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { Table } from '@tanstack/react-table';
import type { AdminVideoInvoice } from '../../api/types';
import {
  batchIssueVideoInvoices,
  batchRejectVideoInvoices
} from '../../api/service';
import { videoInvoiceKeys } from '../../api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BatchActionBarProps {
  table: Table<AdminVideoInvoice>;
}

export function BatchActionBar({ table }: BatchActionBarProps) {
  const queryClient = useQueryClient();
  const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original.id);

  const invalidate = () => {
    table.resetRowSelection();
    void queryClient.invalidateQueries({ queryKey: videoInvoiceKeys.all });
  };

  const issueMutation = useMutation({
    mutationFn: () => batchIssueVideoInvoices(selected),
    onSuccess: () => {
      toast.success('批量开票成功');
      invalidate();
    },
    onError: () => toast.error('批量开票失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => batchRejectVideoInvoices(selected),
    onSuccess: () => {
      toast.success('批量驳回成功');
      invalidate();
    },
    onError: () => toast.error('批量驳回失败')
  });

  const pending = issueMutation.isPending || rejectMutation.isPending;

  return (
    <div className='flex items-center gap-2 rounded-lg border bg-muted/50 p-2'>
      <span className='text-muted-foreground text-sm'>已选 {selected.length} 条</span>
      <Button
        size='sm'
        variant='outline'
        disabled={pending}
        onClick={() => issueMutation.mutate()}
      >
        <Icons.check className='mr-1 h-4 w-4' />
        批量开票
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
    </div>
  );
}
