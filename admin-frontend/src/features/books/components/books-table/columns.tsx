'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminBook } from '../../api/types';
import { BOOK_STATUS_MAP, BOOK_STATUS_OPTIONS } from '../../api/types';
import { approveBook, rejectBook } from '../../api/service';
import { bookKeys } from '../../api/queries';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { AssetImage } from '@/components/admin/asset-image';
import { getAdminUserDetailUrl } from '@/lib/frontend-links';

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

function BookCellAction({ data }: { data: AdminBook }) {
  const isPending = data.status === 0;
  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={data.title}
      onApprove={() => approveBook(data.id)}
      onReject={(reason) => rejectBook(data.id, reason)}
      invalidateKey={bookKeys.all}
      idleLabel={data.status === 1 ? '已通过' : data.status === 2 ? '已驳回' : undefined}
      extra={
        <Link href={`/dashboard/books/list/${data.id}`}>
          <span className='text-primary text-sm hover:underline'>详情</span>
        </Link>
      }
    />
  );
}

export const columns: ColumnDef<AdminBook>[] = [
  {
    accessorKey: 'id',
    header: '著作ID',
    enableSorting: false
  },
  {
    id: 'cover',
    header: '封面',
    cell: ({ row }) => (
      <AssetImage
        src={row.original.coverUrl}
        alt={row.original.title}
        width={40}
        height={56}
        className='h-14 w-10 rounded object-cover'
        fallback={
          <div className='bg-muted flex h-14 w-10 items-center justify-center rounded'>
            <Icons.books className='text-muted-foreground h-4 w-4' />
          </div>
        }
      />
    )
  },
  {
    accessorKey: 'title',
    header: '书名',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/books/list/${row.original.id}`}
        className='font-medium text-primary hover:underline line-clamp-2 max-w-[200px]'
      >
        {row.original.title}
      </Link>
    ),
    meta: {
      label: '书名',
      placeholder: '搜索书名/作者...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'authorName',
    header: '专家/作者',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return val ? new Date(val).toLocaleString('zh-CN') : '-';
    }
  },
  {
    accessorKey: 'submitterNickname',
    header: '用户名',
    cell: ({ row }) => {
      const name = row.original.submitterNickname;
      const uid = row.original.submitterUserId;
      if (!name || !uid) return '-';
      return (
        <Link href={getAdminUserDetailUrl(uid)} className='text-primary hover:underline'>
          {name}
        </Link>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<AdminBook, unknown> }) => (
      <DataTableColumnHeader column={column} title='审核状态' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(status)}>
          {BOOK_STATUS_MAP[status] ?? '-'}
        </Badge>
      );
    },
    meta: {
      label: '审核状态',
      variant: 'select' as const,
      options: BOOK_STATUS_OPTIONS
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <BookCellAction data={row.original} />
  }
];
