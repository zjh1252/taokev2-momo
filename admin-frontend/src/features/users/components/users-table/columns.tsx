'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS, ROLE_LABEL_MAP } from './options';

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'nickname',
    accessorKey: 'nickname',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='昵称' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.nickname || '-'}
        </span>
        {row.original.realName && (
          <span className='text-muted-foreground text-xs'>
            {row.original.realName}
          </span>
        )}
      </div>
    ),
    meta: {
      label: '昵称',
      placeholder: '搜索用户...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone',
    header: '手机号'
  },
  {
    id: 'roles',
    header: '角色',
    cell: ({ row }) => {
      const roles = row.original.roles;
      if (!roles || roles.length === 0) return '-';
      return (
        <div className='flex flex-wrap gap-1'>
          {roles.map((r) => (
            <Badge key={r.role} variant='outline' className='text-xs'>
              {ROLE_LABEL_MAP[r.role] || r.role}
            </Badge>
          ))}
        </div>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      const label =
        STATUS_OPTIONS.find((o) => o.value === String(status))?.label ??
        '未知';
      const variant = status === 1 ? 'default' : 'destructive';
      return <Badge variant={variant}>{label}</Badge>;
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'createdAt',
    header: '注册时间',
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
