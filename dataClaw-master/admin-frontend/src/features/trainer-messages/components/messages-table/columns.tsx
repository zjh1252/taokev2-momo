'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminTrainerMessage } from '../../api/types';
import {
  MESSAGE_STATUS_MAP,
  MESSAGE_STATUS_OPTIONS,
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

function statusVariant(
  status: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 0:
      return 'secondary';
    case 1:
      return 'outline';
    case 2:
      return 'default';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminTrainerMessage>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false,
  },
  {
    id: 'trainingTopic',
    accessorKey: 'trainingTopic',
    header: ({ column }: { column: Column<AdminTrainerMessage, unknown> }) => (
      <DataTableColumnHeader column={column} title='培训主题' />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/trainer-messages/${row.original.id}`}
        className='max-w-[220px] truncate font-medium text-primary hover:underline block'
      >
        {row.original.trainingTopic}
      </Link>
    ),
    meta: {
      label: '培训主题 / 联系人 / 公司',
      placeholder: '搜索培训主题、联系人或公司...',
      variant: 'text' as const,
      icon: Icons.text,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'trainerNickname',
    header: '目标专家',
    cell: ({ row }) => {
      const name = row.original.trainerNickname;
      const id = row.original.trainerUserId;
      return (
        <div className='text-sm'>
          {name || '-'}
          {id ? (
            <span className='text-muted-foreground ml-1'>#{id}</span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: 'contactName',
    header: '联系人',
    cell: ({ row }) => (
      <div className='text-sm'>
        <div>{row.original.contactName}</div>
        <div className='text-muted-foreground text-xs'>
          {row.original.contactMobile}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'companyName',
    header: '公司',
    cell: ({ row }) => (
      <div className='max-w-[160px] truncate text-sm'>
        {row.original.companyName}
      </div>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<AdminTrainerMessage, unknown> }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(status)}>
          {MESSAGE_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: MESSAGE_STATUS_OPTIONS,
    },
  },
  {
    accessorKey: 'createdAt',
    header: '提交时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleString('zh-CN');
    },
  },
  {
    id: 'actions',
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
