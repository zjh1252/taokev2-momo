'use client';
import { Badge } from '@/components/ui/badge';
import type { AdminInstitutionEmployeeApplication } from '../../api/types';
import { APPLICATION_STATUS_MAP, APPLICATION_STATUS_OPTIONS } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function statusVariant(status: number) {
  switch (status) {
    case 1:
      return 'default';
    case 2:
      return 'secondary';
    case 3:
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminInstitutionEmployeeApplication>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'applicant',
    header: '申请人',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.nickname || '-'}
        </span>
        {row.original.phone && (
          <span className='text-muted-foreground text-xs'>
            {row.original.phone}
          </span>
        )}
      </div>
    )
  },
  {
    accessorKey: 'orgName',
    header: '所属机构',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'position',
    header: '职位',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'department',
    header: '部门',
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
          {APPLICATION_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: APPLICATION_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'rejectReason',
    header: '驳回原因',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return val ? (
        <span className='text-destructive text-xs'>{val}</span>
      ) : (
        '-'
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: '申请时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
