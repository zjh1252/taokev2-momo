'use client';
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
    default:
      return '-';
  }
}

export const columns: ColumnDef<AdminTrainingReview>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'reviewScope',
    accessorKey: 'reviewScope',
    header: ({ column }: { column: Column<AdminTrainingReview, unknown> }) => (
      <DataTableColumnHeader column={column} title='范围' />
    ),
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const v = cell.getValue<string>();
      return REVIEW_SCOPE_MAP[v] ?? v ?? '-';
    },
    meta: {
      label: '评价范围',
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
    header: '均分',
    cell: ({ cell }) => {
      const v = cell.getValue<string | number>();
      return v != null ? String(v) : '-';
    }
  },
  {
    accessorKey: 'commentText',
    header: '评价内容',
    cell: ({ cell }) => {
      const t = cell.getValue<string>();
      if (!t) return '-';
      return (
        <div className='max-w-[220px] truncate' title={t}>
          {t.length > 80 ? `${t.slice(0, 80)}…` : t}
        </div>
      );
    }
  },
  {
    accessorKey: 'submitterName',
    header: '提交人',
    cell: ({ row }) => {
      const name = row.original.submitterName;
      if (row.original.anonymous) {
        return name ? `${name}（匿名）` : '匿名';
      }
      return name || `用户 #${row.original.userId}`;
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
