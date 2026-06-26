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
import type { AdminVideoOrder } from '../../api/types';
import { refreshVideoOrderStatus } from '../../api/service';
import { videoOrderKeys } from '../../api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';

interface CellActionProps {
  data: AdminVideoOrder;
}

export function CellAction({ data }: CellActionProps) {
  const queryClient = useQueryClient();

  const refreshMutation = useMutation({
    mutationFn: () => refreshVideoOrderStatus(data.orderNo),
    onSuccess: () => {
      toast.success('订单状态已刷新');
      void queryClient.invalidateQueries({ queryKey: videoOrderKeys.all });
    },
    onError: () => toast.error('刷新失败')
  });

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
        <DropdownMenuItem
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <Icons.spinner
            className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`}
          />
          刷新状态
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/video-orders/${data.id}`}>
            <Icons.externalLink className='mr-2 h-4 w-4' />
            查看详情
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
