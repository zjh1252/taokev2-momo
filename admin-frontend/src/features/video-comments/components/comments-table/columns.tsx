'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { createSelectColumn } from '@/components/ui/table/data-table-select-column';
import { Icons } from '@/components/icons';
import type { AdminVideoComment } from '../../api/types';
import {
  VIDEO_COMMENT_AUDIT_MAP,
  VIDEO_COMMENT_AUDIT_OPTIONS
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { CellAction } from './cell-action';

function auditVariant(status: number) {
  switch (status) {
    case 1:
      return 'default';
    case 0:
      return 'secondary';
    default:
      return 'outline';
  }
}

function auditClassName(status: number) {
  switch (status) {
    case 1:
      return 'bg-green-600 hover:bg-green-600';
    case 0:
      return 'bg-yellow-500 hover:bg-yellow-500 text-black';
    default:
      return '';
  }
}

export const columns: ColumnDef<AdminVideoComment>[] = [
  createSelectColumn<AdminVideoComment>(),
  {
    id: 'videoTitle',
    accessorKey: 'videoTitle',
    header: ({
      column
    }: {
      column: Column<AdminVideoComment, unknown>;
    }) => <DataTableColumnHeader column={column} title='视频名称' />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/videos/${row.original.videoId}`}
        className='text-primary hover:underline max-w-[180px] truncate block'
      >
        {row.original.videoTitle}
      </Link>
    ),
    meta: {
      label: '视频名称',
      placeholder: '搜索视频...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'content',
    header: '评论内容',
    cell: ({ row }) => (
      <p className='line-clamp-2 max-w-[260px] text-sm' title={row.original.content}>
        {row.original.content}
      </p>
    )
  },
  {
    id: 'commentUser',
    accessorKey: 'userName',
    header: ({
      column
    }: {
      column: Column<AdminVideoComment, unknown>;
    }) => <DataTableColumnHeader column={column} title='评论用户' />,
    cell: ({ row }) => (
      <div className='text-sm'>
        <div>{row.original.userName || `用户 #${row.original.userId}`}</div>
        <div className='text-muted-foreground text-xs'>评分 {row.original.rating}</div>
      </div>
    ),
    meta: {
      label: '评论用户',
      placeholder: '搜索用户...',
      variant: 'text' as const,
      icon: Icons.user
    },
    enableColumnFilter: true
  },
  {
    id: 'auditStatus',
    accessorKey: 'auditStatus',
    header: ({
      column
    }: {
      column: Column<AdminVideoComment, unknown>;
    }) => <DataTableColumnHeader column={column} title='审核状态' />,
    cell: ({ row }) => (
      <Badge
        variant={auditVariant(row.original.auditStatus)}
        className={auditClassName(row.original.auditStatus)}
      >
        {VIDEO_COMMENT_AUDIT_MAP[row.original.auditStatus] ??
          row.original.auditStatusLabel}
      </Badge>
    ),
    meta: {
      label: '审核状态',
      variant: 'select' as const,
      options: VIDEO_COMMENT_AUDIT_OPTIONS
    },
    enableColumnFilter: true
  },
  {
    id: 'publisher',
    accessorKey: 'publisherName',
    header: ({
      column
    }: {
      column: Column<AdminVideoComment, unknown>;
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
    accessorKey: 'createdAt',
    header: '评论时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleString('zh-CN');
    }
  },
  {
    id: 'actions',
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
