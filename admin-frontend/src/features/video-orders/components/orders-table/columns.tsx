'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { AdminVideoOrder } from '../../api/types';
import {
  VIDEO_ORDER_STATUS_MAP,
  VIDEO_ORDER_STATUS_OPTIONS
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { CellAction } from './cell-action';

function statusVariant(status: number) {
  switch (status) {
    case 1:
      return 'default';
    case 0:
      return 'secondary';
    case 3:
      return 'destructive';
    default:
      return 'outline';
  }
}

function CopyOrderNo({ orderNo }: { orderNo: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderNo);
      toast.success('订单号已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className='flex items-center gap-1'>
      <span className='font-mono text-sm'>{orderNo}</span>
      <Button
        variant='ghost'
        size='icon'
        className='h-7 w-7'
        onClick={() => void handleCopy()}
      >
        <Icons.page className='h-3.5 w-3.5' />
      </Button>
    </div>
  );
}

export const columns: ColumnDef<AdminVideoOrder>[] = [
  {
    accessorKey: 'createdAt',
    header: '下单时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleString('zh-CN');
    }
  },
  {
    accessorKey: 'orderNo',
    header: '订单号',
    cell: ({ row }) => <CopyOrderNo orderNo={row.original.orderNo} />
  },
  {
    accessorKey: 'userName',
    header: '购买用户',
    cell: ({ row }) => row.original.userName || `用户 #${row.original.userId}`
  },
  {
    id: 'videoTitle',
    accessorKey: 'videoTitles',
    header: ({
      column
    }: {
      column: Column<AdminVideoOrder, unknown>;
    }) => <DataTableColumnHeader column={column} title='视频名称' />,
    cell: ({ row }) => {
      const firstItem = row.original.items?.[0];
      const episodes = firstItem?.totalEpisodes;
      return (
        <div className='max-w-[220px]'>
          <div className='truncate font-medium'>
            {row.original.videoTitles || firstItem?.productTitle || '-'}
          </div>
          {episodes != null && episodes > 1 ? (
            <span className='text-muted-foreground text-xs'>共 {episodes} 集</span>
          ) : null}
        </div>
      );
    },
    meta: {
      label: '视频名称',
      placeholder: '搜索视频名称...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'payAmount',
    header: '支付金额',
    cell: ({ cell }) => {
      const val = cell.getValue<number>();
      return val != null ? `¥${val.toLocaleString()}` : '-';
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({
      column
    }: {
      column: Column<AdminVideoOrder, unknown>;
    }) => <DataTableColumnHeader column={column} title='状态' />,
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {VIDEO_ORDER_STATUS_MAP[row.original.status] ?? row.original.statusLabel}
      </Badge>
    ),
    meta: {
      label: '订单状态',
      variant: 'select' as const,
      options: VIDEO_ORDER_STATUS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'learnerCount',
    header: '学习人数',
    cell: ({ cell }) => cell.getValue<number>() ?? 0
  },
  {
    id: 'publisher',
    accessorKey: 'publisherName',
    header: ({
      column
    }: {
      column: Column<AdminVideoOrder, unknown>;
    }) => <DataTableColumnHeader column={column} title='发布者' />,
    cell: ({ row }) => row.original.publisherName ?? '-',
    meta: {
      label: '发布者',
      placeholder: '搜索发布者...',
      variant: 'text' as const,
      icon: Icons.user
    },
    enableColumnFilter: true
  },
  {
    id: 'dateRange',
    accessorKey: 'createdAt',
    header: '日期范围',
    enableColumnFilter: true,
    meta: {
      label: '下单日期',
      variant: 'dateRange' as const
    },
    enableHiding: false
  },
  {
    id: 'actions',
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
