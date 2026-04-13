'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminTrainerHighlight } from '../../api/types';
import {
  HIGHLIGHT_STATUS_MAP,
  HIGHLIGHT_STATUS_OPTIONS,
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';

function statusVariant(status: number) {
  switch (status) {
    case 1:
      return 'default';
    case 0:
      return 'secondary';
    case 2:
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminTrainerHighlight>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'cover',
    header: '封面',
    cell: ({ row }) => {
      const coverUrl = row.original.coverImage
        || row.original.files?.[0]?.thumbnailUrl
        || row.original.files?.[0]?.fileUrl;
      return coverUrl ? (
        <div className='relative h-10 w-16 overflow-hidden rounded'>
          <Image
            src={coverUrl}
            alt={row.original.title || ''}
            fill
            className='object-cover'
          />
        </div>
      ) : (
        <div className='flex h-10 w-16 items-center justify-center rounded bg-muted'>
          <Icons.media className='h-4 w-4 text-muted-foreground' />
        </div>
      );
    }
  },
  {
    accessorKey: 'title',
    header: '标题',
    cell: ({ cell }) => (
      <div className='max-w-[160px] truncate'>
        {cell.getValue<string>() || '-'}
      </div>
    )
  },
  {
    accessorKey: 'trainerName',
    header: '所属专家',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'filesCount',
    header: '文件数',
    cell: ({ row }) => {
      const count = row.original.files?.length || 0;
      return <span>{count}</span>;
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<AdminTrainerHighlight, unknown> }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(status)}>
          {HIGHLIGHT_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: HIGHLIGHT_STATUS_OPTIONS
    }
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
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
