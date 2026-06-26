'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminDemandListItem } from '../../api/types';
import { DEMAND_STATUS_MAP } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const statusVariantMap: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  1: 'outline',
  2: 'default',
  3: 'secondary',
  4: 'default',
  5: 'destructive'
};

function formatBudget(min: number | null, max: number | null): string {
  if (min == null && max == null) return '面议';
  if (min != null && max != null) return `${min.toLocaleString()} - ${max.toLocaleString()}元`;
  if (min != null) return `${min.toLocaleString()}元起`;
  return `最高${max!.toLocaleString()}元`;
}

export const columns: ColumnDef<AdminDemandListItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'keyword',
    accessorKey: 'title',
    header: ({
      column
    }: {
      column: Column<AdminDemandListItem, unknown>;
    }) => <DataTableColumnHeader column={column} title='标题/主题' />,
    cell: ({ row }) => (
      <div className='flex flex-col max-w-[240px]'>
        <Link
          href={`/dashboard/demands/${row.original.id}`}
          className='font-medium text-primary hover:underline truncate'
        >
          {row.original.title || row.original.trainingTopic || '培训需求'}
        </Link>
        {row.original.trainingTopic && row.original.title && (
          <span className='text-muted-foreground text-xs truncate'>
            {row.original.trainingTopic}
          </span>
        )}
      </div>
    ),
    meta: {
      label: '关键词',
      placeholder: '搜索标题/主题...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'demandTypeLabel',
    header: '需求类型',
    cell: ({ cell }) => (
      <span className='text-muted-foreground text-xs'>
        {cell.getValue<string>()}
      </span>
    )
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariantMap[status] ?? 'outline'}>
          {DEMAND_STATUS_MAP[status] ?? row.original.statusLabel}
        </Badge>
      );
    }
  },
  {
    id: 'budget',
    header: '预算',
    cell: ({ row }) => (
      <span className='text-sm'>
        {formatBudget(row.original.budgetMin, row.original.budgetMax)}
      </span>
    )
  },
  {
    accessorKey: 'traineeCount',
    header: '人数',
    cell: ({ cell }) => {
      const val = cell.getValue<number | null>();
      return val ? `${val}人` : '-';
    }
  },
  {
    accessorKey: 'createdAt',
    header: '提交时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleDateString('zh-CN');
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/demands/${row.original.id}`}
        className='text-primary hover:underline text-sm'
      >
        详情
      </Link>
    )
  }
];
