'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminTrainerCase } from '../../api/types';
import { CASE_STATUS_MAP, CASE_STATUS_OPTIONS } from '../../api/types';
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
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminTrainerCase>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    accessorKey: 'caseTitle',
    header: '案例标题',
    cell: ({ row }) => (
      <div className='max-w-[200px] truncate font-medium'>
        {row.original.caseTitle}
      </div>
    )
  },
  {
    accessorKey: 'trainerName',
    header: '所属专家',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'enterpriseName',
    header: '企业名称',
    cell: ({ row }) => (
      <div className='max-w-[150px] truncate'>
        {row.original.enterpriseName}
      </div>
    )
  },
  {
    accessorKey: 'trainingTopic',
    header: '培训主题',
    cell: ({ cell }) => (
      <div className='max-w-[150px] truncate'>
        {cell.getValue<string>() || '-'}
      </div>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<AdminTrainerCase, unknown> }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(status)}>
          {CASE_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: CASE_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'trainingDate',
    header: '培训日期',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return val || '-';
    }
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
