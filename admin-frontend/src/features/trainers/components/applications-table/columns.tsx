'use client';
import { Badge } from '@/components/ui/badge';
import type { AdminTrainerApplication } from '../../api/types';
import { APPLICATION_STATUS_MAP, APPLICATION_STATUS_OPTIONS } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { AssetImage } from '@/components/admin/asset-image';
import { CellAction } from './cell-action';
import { getAdminUserDetailUrl } from '@/lib/frontend-links';

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

export const columns: ColumnDef<AdminTrainerApplication>[] = [
  {
    accessorKey: 'id',
    header: '申请ID',
    enableSorting: false
  },
  {
    accessorKey: 'trainerId',
    header: '专家ID',
    enableSorting: false,
    cell: ({ cell }) => cell.getValue<number | null>() ?? '-'
  },
  {
    id: 'applicant',
    header: '申请人',
    cell: ({ row }) => {
      const name = row.original.trainerName || row.original.nickname || '-';
      const href = row.original.trainerId
        ? `/dashboard/trainers/${row.original.trainerId}?from=applications`
        : getAdminUserDetailUrl(row.original.userId);
      return (
        <div className='flex items-center gap-3'>
          <AssetImage
            src={row.original.trainerAvatar}
            alt={name}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full object-cover'
            fallback={
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
                <Icons.user className='h-4 w-4 text-muted-foreground' />
              </div>
            }
          />
          <div className='flex flex-col'>
            <Link href={href} className='font-medium text-primary hover:underline'>
              {name}
            </Link>
            {row.original.phone && (
              <span className='text-muted-foreground text-xs'>
                {row.original.phone}
              </span>
            )}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'trainerTitle',
    header: '头衔',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell, row }) => {
      if (row.original.reapplying) {
        return <Badge variant='secondary'>重提申请</Badge>;
      }
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
    id: 'submittedAt',
    header: '提交时间',
    cell: ({ row }) => {
      // 二次申请后 updatedAt 为最近提交时间，优先展示
      const val = row.original.updatedAt || row.original.createdAt;
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
