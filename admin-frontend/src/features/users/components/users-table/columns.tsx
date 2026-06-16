'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import {
  REG_ORIGIN_MAP,
  REG_ORIGIN_OPTIONS,
  REAL_NAME_CERT_STATUS_MAP,
  REAL_NAME_CERT_STATUS_OPTIONS
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import {
  STATUS_OPTIONS,
  ROLE_LABEL_MAP,
  ROLE_FILTER_OPTIONS
} from './options';

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
        <Link
          href={`/dashboard/users/${row.original.id}`}
          className='font-medium text-primary hover:underline'
        >
          {row.original.nickname || '-'}
        </Link>
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
    id: 'role',
    accessorKey: 'role',
    header: '角色筛选',
    enableColumnFilter: true,
    meta: {
      label: '角色',
      variant: 'select' as const,
      options: ROLE_FILTER_OPTIONS
    }
  },
  {
    id: 'regOrigin',
    accessorKey: 'regOrigin',
    header: '注册来源',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const v = row.original.regOrigin;
      if (v == null) return '-';
      return REG_ORIGIN_MAP[v] ?? String(v);
    },
    meta: {
      label: '注册来源',
      variant: 'select' as const,
      options: REG_ORIGIN_OPTIONS
    }
  },
  {
    accessorKey: 'courseCount',
    header: '课程数',
    cell: ({ row }) => row.original.courseCount ?? 0
  },
  {
    accessorKey: 'caseCount',
    header: '案例数',
    cell: ({ row }) => row.original.caseCount ?? 0
  },
  {
    id: 'realNameCertStatus',
    accessorKey: 'realNameCertStatus',
    header: '实名认证',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const v = row.original.realNameCertStatus;
      if (v == null) return '未提交';
      return REAL_NAME_CERT_STATUS_MAP[v] ?? String(v);
    },
    meta: {
      label: '实名认证',
      variant: 'select' as const,
      options: REAL_NAME_CERT_STATUS_OPTIONS
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
