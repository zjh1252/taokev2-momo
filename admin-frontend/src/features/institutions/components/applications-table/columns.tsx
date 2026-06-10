'use client';
import { Badge } from '@/components/ui/badge';
import type { AdminInstitutionApplication } from '../../api/types';
import { APPLICATION_STATUS_MAP, APPLICATION_STATUS_OPTIONS } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';

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

export const columns: ColumnDef<AdminInstitutionApplication>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'applicant',
    header: '申请人',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        {row.original.logoUrl ? (
          <Image
            src={resolveAssetUrl(row.original.logoUrl)}
            alt={row.original.orgName || ''}
            width={32}
            height={32}
            className='h-8 w-8 rounded object-cover'
          />
        ) : (
          <div className='flex h-8 w-8 items-center justify-center rounded bg-muted'>
            <Icons.building className='h-4 w-4 text-muted-foreground' />
          </div>
        )}
        <div className='flex flex-col'>
          <span className='font-medium'>
            {row.original.orgName || row.original.nickname || '-'}
          </span>
          {row.original.phone && (
            <span className='text-muted-foreground text-xs'>
              {row.original.phone}
            </span>
          )}
        </div>
      </div>
    )
  },
  {
    accessorKey: 'contactName',
    header: '联系人',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'contactPhone',
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
