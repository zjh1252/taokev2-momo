'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { OpenCourseEnrollment } from '../../api/types';
import {
  ENROLLMENT_STATUS_MAP,
  ENROLLMENT_STATUS_OPTIONS,
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
      return 'default';
    case 2:
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDt(value?: string | null) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

function formatPlanRange(start?: string | null, end?: string | null) {
  if (!start && !end) return '-';
  return `${formatDt(start)} ~ ${formatDt(end)}`;
}

export const columns: ColumnDef<OpenCourseEnrollment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='全选'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='选择行'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<OpenCourseEnrollment, unknown> }) => (
      <DataTableColumnHeader column={column} title='提交时间' />
    ),
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {formatDt(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: 'realName',
    header: '真实姓名',
  },
  {
    accessorKey: 'companyName',
    header: '公司名称',
    cell: ({ row }) => (
      <div className='max-w-[160px] truncate text-sm'>
        {row.original.companyName}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: '电子邮件',
    cell: ({ row }) => (
      <div className='max-w-[180px] truncate text-sm'>{row.original.email}</div>
    ),
  },
  {
    accessorKey: 'companyPhone',
    header: '公司电话',
    cell: ({ row }) => row.original.companyPhone || '-',
  },
  {
    accessorKey: 'mobile',
    header: '手机号码',
    cell: ({ row }) => row.original.mobile || '-',
  },
  {
    id: 'keyword',
    accessorKey: 'courseTitle',
    header: '关联课程',
    cell: ({ row }) => (
      <div className='max-w-[220px] text-sm'>
        <div className='truncate font-medium'>{row.original.courseTitle}</div>
        <div className='text-muted-foreground text-xs'>
          #{row.original.courseId}
        </div>
      </div>
    ),
    meta: {
      label: '课程名称 / 课程 ID',
      placeholder: '搜索课程名称或课程 ID...',
      variant: 'text' as const,
      icon: Icons.text,
    },
    enableColumnFilter: true,
  },
  {
    id: 'planTime',
    header: '期次开课时间',
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {formatPlanRange(row.original.planStartTime, row.original.planEndTime)}
      </span>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<OpenCourseEnrollment, unknown> }) => (
      <DataTableColumnHeader column={column} title='处理状态' />
    ),
    enableColumnFilter: true,
    meta: {
      label: '处理状态',
      variant: 'select' as const,
      options: ENROLLMENT_STATUS_OPTIONS,
    },
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {ENROLLMENT_STATUS_MAP[row.original.status] ?? row.original.statusLabel}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
