'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminVideo } from '../../api/types';
import { VIDEO_STATUS_MAP, VIDEO_STATUS_OPTIONS } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

function statusVariant(status: number) {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? `${m}m` : ''}`;
  return `${m}m`;
}

export const columns: ColumnDef<AdminVideo>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<AdminVideo, unknown> }) => (
      <DataTableColumnHeader column={column} title='录播课名称' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <Link
          href={`/dashboard/videos/${row.original.id}`}
          className='font-medium text-primary hover:underline line-clamp-1'
        >
          {row.original.title}
        </Link>
        <span className='text-muted-foreground text-xs'>
          {row.original.videoTypeLabel}
          {row.original.teacherName && ` · ${row.original.teacherName}`}
        </span>
      </div>
    ),
    meta: {
      label: '录播课名称',
      placeholder: '搜索录播课...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'categoryName',
    header: '分类',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'totalEpisodes',
    header: '集数',
    cell: ({ row }) => `${row.original.totalEpisodes} 集`
  },
  {
    accessorKey: 'duration',
    header: '时长',
    cell: ({ row }) => formatDuration(row.original.duration)
  },
  {
    accessorKey: 'price',
    header: '价格',
    cell: ({ row }) => {
      if (row.original.isFree === 1) return <Badge variant='outline'>免费</Badge>;
      const p = row.original.price;
      return p > 0 ? `¥${Number(p).toLocaleString()}` : '-';
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(status)}>
          {VIDEO_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: VIDEO_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'studentCount',
    header: '学习人数',
    cell: ({ cell }) => cell.getValue<number>()?.toLocaleString() ?? '0'
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleDateString('zh-CN');
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
