'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { createSelectColumn } from '@/components/ui/table/data-table-select-column';
import { Icons } from '@/components/icons';
import type { AdminVideoInvoice } from '../../api/types';
import {
  VIDEO_INVOICE_STATUS_MAP,
  VIDEO_INVOICE_STATUS_OPTIONS,
  INVOICE_TYPE_OPTIONS,
  TITLE_TYPE_OPTIONS
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function statusClassName(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 hover:bg-yellow-500 text-black';
    case 'PROCESSING':
      return 'bg-blue-500 hover:bg-blue-500';
    case 'ISSUED':
      return 'bg-green-600 hover:bg-green-600';
    case 'FAILED':
      return 'bg-red-600 hover:bg-red-600';
    default:
      return '';
  }
}

export const columns: ColumnDef<AdminVideoInvoice>[] = [
  createSelectColumn<AdminVideoInvoice>(),
  {
    id: 'orderNo',
    accessorKey: 'orderNo',
    header: ({
      column
    }: {
      column: Column<AdminVideoInvoice, unknown>;
    }) => <DataTableColumnHeader column={column} title='订单号' />,
    cell: ({ row }) => (
      <span className='font-mono text-sm'>{row.original.orderNo}</span>
    ),
    meta: {
      label: '订单号',
      placeholder: '搜索订单号...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'videoName',
    accessorKey: 'videoName',
    header: ({
      column
    }: {
      column: Column<AdminVideoInvoice, unknown>;
    }) => <DataTableColumnHeader column={column} title='视频名称' />,
    cell: ({ row }) => (
      <span className='max-w-[180px] truncate block'>{row.original.videoName}</span>
    ),
    meta: {
      label: '视频名称',
      placeholder: '搜索视频...',
      variant: 'text' as const,
      icon: Icons.video
    },
    enableColumnFilter: true
  },
  {
    id: 'user',
    accessorKey: 'userName',
    header: ({
      column
    }: {
      column: Column<AdminVideoInvoice, unknown>;
    }) => <DataTableColumnHeader column={column} title='申请用户' />,
    cell: ({ row }) => row.original.userName || `用户 #${row.original.userId}`,
    meta: {
      label: '申请用户',
      placeholder: '搜索用户...',
      variant: 'text' as const,
      icon: Icons.user
    },
    enableColumnFilter: true
  },
  {
    id: 'invoiceType',
    accessorKey: 'invoiceTypeLabel',
    header: '发票类型',
    cell: ({ row }) => row.original.invoiceTypeLabel,
    meta: {
      label: '发票类型',
      variant: 'select' as const,
      options: INVOICE_TYPE_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'titleType',
    accessorKey: 'titleTypeLabel',
    header: '抬头类型',
    cell: ({ row }) => row.original.titleTypeLabel,
    meta: {
      label: '抬头类型',
      variant: 'select' as const,
      options: TITLE_TYPE_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'title',
    header: '发票抬头',
    cell: ({ row }) => (
      <span className='max-w-[160px] truncate block'>{row.original.title}</span>
    )
  },
  {
    accessorKey: 'amount',
    header: '开票金额',
    cell: ({ row }) => `¥${row.original.amount.toLocaleString()}`
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({
      column
    }: {
      column: Column<AdminVideoInvoice, unknown>;
    }) => <DataTableColumnHeader column={column} title='状态' />,
    cell: ({ row }) => (
      <Badge className={statusClassName(row.original.status)}>
        {VIDEO_INVOICE_STATUS_MAP[row.original.status] ?? row.original.statusLabel}
      </Badge>
    ),
    meta: {
      label: '开票状态',
      variant: 'select' as const,
      options: VIDEO_INVOICE_STATUS_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'email',
    header: '接收邮箱',
    cell: ({ row }) => row.original.email ?? '-'
  },
  {
    id: 'dateRange',
    accessorKey: 'createdAt',
    header: '申请时间',
    cell: ({ row }) => {
      const val = row.original.createdAt;
      if (!val) return '-';
      return new Date(val).toLocaleString('zh-CN');
    },
    meta: {
      label: '申请日期',
      variant: 'dateRange' as const
    },
    enableColumnFilter: true,
    enableHiding: false
  },
  {
    id: 'actions',
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
