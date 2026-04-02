'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminTrainer } from '../../api/types';
import { TRAINER_STATUS_MAP, TRAINER_STATUS_OPTIONS } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';

function statusVariant(status: number) {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
      return 'destructive';
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminTrainer>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<AdminTrainer, unknown> }) => (
      <DataTableColumnHeader column={column} title='专家姓名' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        {row.original.avatar ? (
          <Image
            src={row.original.avatar}
            alt={row.original.name || ''}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full object-cover'
          />
        ) : (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
            <Icons.user className='h-4 w-4 text-muted-foreground' />
          </div>
        )}
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.name || '-'}</span>
          {row.original.title && (
            <span className='text-muted-foreground text-xs'>
              {row.original.title}
            </span>
          )}
        </div>
      </div>
    ),
    meta: {
      label: '专家姓名',
      placeholder: '搜索专家...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone',
    header: '联系电话',
    cell: ({ cell }) => cell.getValue<string>() || '-'
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
          {TRAINER_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: TRAINER_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'score',
    header: '评分',
    cell: ({ cell }) => {
      const val = cell.getValue<number>();
      return val > 0 ? val.toFixed(1) : '-';
    }
  },
  {
    accessorKey: 'viewCount',
    header: '曝光量',
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
  }
];
