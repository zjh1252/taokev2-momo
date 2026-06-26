'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { AdminVideoSupplier } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AdminVideoSupplier>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    accessorKey: 'userId',
    header: '用户ID',
    enableSorting: false
  },
  {
    id: 'search',
    accessorKey: 'companyName',
    header: ({
      column
    }: {
      column: Column<AdminVideoSupplier, unknown>;
    }) => <DataTableColumnHeader column={column} title='公司名称' />,
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.companyName}</span>
    ),
    meta: {
      label: '搜索',
      placeholder: '搜索公司名称...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'memberTypeLabel',
    header: '会员类型',
    cell: ({ row }) => row.original.memberTypeLabel
  },
  {
    accessorKey: 'videoCount',
    header: '视频数'
  },
  {
    accessorKey: 'categoryCount',
    header: '分类数'
  },
  {
    accessorKey: 'enabled',
    header: '状态',
    cell: ({ row }) => (
      <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
        {row.original.enabled ? '启用' : '禁用'}
      </Badge>
    )
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
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
