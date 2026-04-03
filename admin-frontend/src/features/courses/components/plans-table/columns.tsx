'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminCoursePlan } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';

function formatDateTime(val: string | null) {
  if (!val) return '-';
  const d = new Date(val);
  return `${d.toLocaleDateString('zh-CN')} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
}

export const planColumns: ColumnDef<AdminCoursePlan>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'courseTitle',
    header: ({ column }: { column: Column<AdminCoursePlan, unknown> }) => (
      <DataTableColumnHeader column={column} title='关联课程' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium line-clamp-1'>
          {row.original.courseTitle || '-'}
        </span>
        <span className='text-muted-foreground text-xs'>
          {row.original.courseTypeLabel}
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
    accessorKey: 'startTime',
    header: '开始时间',
    cell: ({ cell }) => formatDateTime(cell.getValue<string>())
  },
  {
    accessorKey: 'endTime',
    header: '结束时间',
    cell: ({ cell }) => formatDateTime(cell.getValue<string>())
  },
  {
    id: 'location',
    header: '上课地点',
    cell: ({ row }) => {
      const plan = row.original;
      if (plan.onlineUrl) {
        return (
          <Badge variant='outline'>
            <Icons.externalLink className='mr-1 h-3 w-3' />
            线上
          </Badge>
        );
      }
      return plan.address || '-';
    }
  },
  {
    accessorKey: 'sortOrder',
    header: '排序',
    cell: ({ cell }) => cell.getValue<number>()
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
