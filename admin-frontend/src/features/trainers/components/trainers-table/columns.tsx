'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminTrainer } from '../../api/types';
import { TRAINER_STATUS_MAP, TRAINER_STATUS_OPTIONS } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { RecommendSwitch } from './recommend-switch';
import { FrontendLink } from '@/components/admin/frontend-link';
import { getTrainerPublicUrl } from '@/lib/frontend-links';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';

function statusVariant(status: number) {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
      return 'destructive';
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminTrainer>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<AdminTrainer, unknown> }) => (
      <DataTableColumnHeader column={column} title='专家姓名' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        {row.original.avatar ? (
          <Image
            src={resolveAssetUrl(row.original.avatar)}
            alt={row.original.name || ''}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full object-cover'
          />
        ) : (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
            <Icons.user className='h-4 w-4 text-muted-foreground' />
          </div>
        )}
        <div className='flex flex-col'>
          <Link
            href={`/dashboard/trainers/${row.original.id}?from=list`}
            className='font-medium text-primary hover:underline'
          >
            {row.original.name || '-'}
          </Link>
          <FrontendLink
            href={getTrainerPublicUrl(row.original.id)}
            className='text-xs text-muted-foreground'
          >
            前台
          </FrontendLink>
          {row.original.title && (
            <span className='text-muted-foreground text-xs'>
              {row.original.title}
            </span>
          )}
        </div>
      </div>
    ),
    meta: {
      label: '专家姓名',
      placeholder: '搜索专家...',
      variant: 'text' as const,
      icon: Icons.text
    },
    size: 320,
    minSize: 260,
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone',
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
          {TRAINER_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: TRAINER_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'score',
    header: '评分',
    cell: ({ cell }) => {
      const val = cell.getValue<number>();
      return val > 0 ? val.toFixed(1) : '-';
    }
  },
  {
    accessorKey: 'viewCount',
    header: '曝光量',
    cell: ({ cell }) => cell.getValue<number>()?.toLocaleString() ?? '0'
  },
  {
    id: 'isRecommended',
    accessorKey: 'isRecommended',
    header: '推荐',
    enableSorting: false,
    cell: ({ row }) => (
      <RecommendSwitch
        trainerId={row.original.id}
        value={row.original.isRecommended}
      />
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
  }
];
