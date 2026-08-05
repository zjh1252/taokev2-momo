'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminTrainingReview } from '../../api/types';
import {
  REVIEW_SCOPE_MAP,
  REVIEW_SCOPE_OPTIONS,
  REVIEW_STATUS_MAP,
  REVIEW_STATUS_OPTIONS
} from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { getAdminUserDetailUrl } from '@/lib/frontend-links';

function statusVariant(status: number) {
  switch (status) {
    case 1:
      return 'default';
    case 0:
      return 'secondary';
    case -1:
      return 'destructive';
    case 2:
      return 'outline';
    default:
      return 'outline';
  }
}

/** 无后端 targetDisplayName 时的兜底文案 */
function targetLabelFallback(row: AdminTrainingReview): string {
  switch (row.reviewScope) {
    case 'COURSE':
      return row.courseTitle?.trim()
        || (row.courseId != null ? `课程 #${row.courseId}` : '-');
    case 'TRAINER':
      return (
        row.expertName?.trim() ||
        (row.trainerUserId != null ? `专家 #${row.trainerUserId}` : '-')
      );
    case 'INSTITUTION':
      return row.institutionId != null ? `机构 #${row.institutionId}` : '-';
    case 'CASE':
      return row.caseId != null ? `案例 #${row.caseId}` : '-';
    case 'VIDEO':
      return (
        row.courseTitle?.trim() ||
        (row.courseId != null ? `录播课 #${row.courseId}` : '-')
      );
    default:
      return '-';
  }
}

export const columns: ColumnDef<AdminTrainingReview>[] = [
  {
    id: 'submitterUser',
    header: '用户ID/用户名',
    enableSorting: false,
    cell: ({ row }) => {
      const { userId, submitterName } = row.original;
      const label = submitterName?.trim() || `用户 #${userId}`;
      if (row.original.anonymous) {
        return (
          <div className='flex flex-col text-xs'>
            <span>{userId}</span>
            <span className='text-muted-foreground'>{label}</span>
          </div>
        );
      }
      return (
        <Link
          href={getAdminUserDetailUrl(userId)}
          className='text-primary flex flex-col text-xs hover:underline'
        >
          <span>{userId}</span>
          <span>{label}</span>
        </Link>
      );
    }
  },
  {
    id: 'reviewScope',
    accessorKey: 'reviewScope',
    header: ({ column }: { column: Column<AdminTrainingReview, unknown> }) => (
      <DataTableColumnHeader column={column} title='评价对象' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const v = cell.getValue<string>();
      return REVIEW_SCOPE_MAP[v] ?? v ?? '-';
    },
    meta: {
      label: '评价对象',
      variant: 'select' as const,
      options: REVIEW_SCOPE_OPTIONS
    }
  },
  {
    id: 'target',
    header: '关联对象',
    cell: ({ row }) => {
      const label =
        row.original.targetDisplayName?.trim() ||
        targetLabelFallback(row.original);
      return (
        <div className='max-w-[200px] truncate' title={label}>
          {label}
        </div>
      );
    }
  },
  {
    id: 'avgScore',
    accessorKey: 'avgScore',
    header: ({ column }: { column: Column<AdminTrainingReview, unknown> }) => (
      <DataTableColumnHeader column={column} title='综合评分' />
    ),
    cell: ({ row }) => {
      const { ratingContent, ratingTeaching, ratingService, avgScore } = row.original;
      const parts = [
        ratingContent ? `内容 ${ratingContent}` : null,
        ratingTeaching ? `授课 ${ratingTeaching}` : null,
        ratingService ? `服务 ${ratingService}` : null
      ].filter(Boolean);
      if (parts.length > 0) {
        return (
          <span className='text-xs whitespace-nowrap' title={parts.join(' · ')}>
            {parts.join(' / ')}
          </span>
        );
      }
      return avgScore != null ? String(avgScore) : '-';
    }
  },
  {
    accessorKey: 'commentText',
    header: '评价内容',
    cell: ({ row, cell }) => {
      const t = cell.getValue<string>();
      if (!t) return '-';
      return (
        <Link
          href={`/dashboard/training-reviews/${row.original.id}`}
          className='text-primary max-w-[220px] truncate block hover:underline'
          title={t}
        >
          {t.length > 80 ? `${t.slice(0, 80)}…` : t}
        </Link>
      );
    }
  },
  {
    id: 'reviewerKeyword',
    accessorKey: 'submitterName',
    header: ({ column }: { column: Column<AdminTrainingReview, unknown> }) => (
      <DataTableColumnHeader column={column} title='提交人' />
    ),
    enableColumnFilter: true,
    meta: {
      label: '评价人',
      placeholder: '评价人姓名...',
      variant: 'text' as const,
      icon: Icons.text
    },
    cell: ({ row }) => {
      const name = row.original.submitterName;
      const label = row.original.anonymous
        ? name
          ? `${name}（匿名）`
          : '匿名'
        : name || `用户 #${row.original.userId}`;
      if (row.original.anonymous) return label;
      return (
        <Link
          href={getAdminUserDetailUrl(row.original.userId)}
          className='text-primary hover:underline'
        >
          {label}
        </Link>
      );
    }
  },
  {
    id: 'reviewedBy',
    accessorKey: 'reviewedBy',
    header: '审核人',
    enableColumnFilter: true,
    meta: {
      label: '审核人',
      placeholder: '审核人用户名...',
      variant: 'text' as const,
      icon: Icons.user
    },
    cell: ({ row }) => {
      const name = row.original.reviewedByName?.trim();
      const reviewedBy = row.original.reviewedBy;
      if (!reviewedBy && !name) return '-';
      const label = name || `用户 #${reviewedBy}`;
      if (!reviewedBy) return label;
      return (
        <Link
          href={getAdminUserDetailUrl(reviewedBy)}
          className='text-primary hover:underline'
        >
          {label}
        </Link>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<AdminTrainingReview, unknown> }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(status)}>
          {REVIEW_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: REVIEW_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleString('zh-CN');
    }
  },
  {
    id: 'actions',
    header: () => <Icons.settings className='h-4 w-4' />,
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
