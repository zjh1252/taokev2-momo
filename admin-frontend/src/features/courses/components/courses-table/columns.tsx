'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminCourse } from '../../api/types';
import {
  COURSE_STATUS_MAP,
  COURSE_STATUS_OPTIONS,
  COURSE_TYPE_OPTIONS
} from '../../api/types';
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

export const columns: ColumnDef<AdminCourse>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<AdminCourse, unknown> }) => (
      <DataTableColumnHeader column={column} title='课程名称' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <Link
          href={`/dashboard/courses/${row.original.id}`}
          className='font-medium text-primary hover:underline line-clamp-1'
        >
          {row.original.title}
        </Link>
        <span className='text-muted-foreground text-xs'>
          {row.original.typeLabel}
          {row.original.trainerName && ` · ${row.original.trainerName}`}
        </span>
      </div>
    ),
    meta: {
      label: '课程名称',
      placeholder: '搜索课程...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: '课程类型',
    cell: ({ row }) => row.original.typeLabel,
    enableColumnFilter: true,
    meta: {
      label: '课程类型',
      variant: 'select' as const,
      options: COURSE_TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'categoryName',
    header: '分类',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'trainerName',
    header: '所属专家',
    cell: ({ cell }) => cell.getValue<string>() || '-'
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
          {COURSE_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: COURSE_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'isFeatured',
    header: '主打',
    cell: ({ cell }) =>
      cell.getValue<number>() === 1 ? (
        <Icons.star className='h-4 w-4 fill-amber-400 text-amber-400' />
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
  },
  {
    accessorKey: 'viewCount',
    header: '浏览量',
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
