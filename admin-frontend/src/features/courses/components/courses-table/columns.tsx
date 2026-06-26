'use client';
import { FrontendLink } from '@/components/admin/frontend-link';
import { Badge } from '@/components/ui/badge';
import { getCoursePublicUrl } from '@/lib/frontend-links';
import Link from 'next/link';
import Image from 'next/image';
import { resolveAssetUrl, isLikelyImageAssetUrl } from '@/lib/resolve-asset-url';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminCourse } from '../../api/types';
import {
  COURSE_STATUS_MAP,
  COURSE_STATUS_OPTIONS,
  COURSE_TYPE_OPTIONS
} from '../../api/types';
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
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminCourse>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'cover',
    header: '封面',
    cell: ({ row }) => {
      const raw = row.original.coverUrl;
      if (!isLikelyImageAssetUrl(raw)) {
        return <span className='text-muted-foreground text-xs'>-</span>;
      }
      const cover = resolveAssetUrl(raw);
      return (
        <div className='relative h-10 w-16 overflow-hidden rounded bg-muted'>
          <Image
            src={cover}
            alt={row.original.title}
            fill
            className='object-cover'
            sizes='64px'
            unoptimized
          />
        </div>
      );
    }
  },
  {
    id: 'name',
    accessorKey: 'title',
    header: ({ column }: { column: Column<AdminCourse, unknown> }) => (
      <DataTableColumnHeader column={column} title='课程名称' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col max-w-[220px]'>
        <div className='flex items-center gap-2'>
          <Link
            href={`/dashboard/courses/${row.original.id}`}
            className='font-medium text-primary hover:underline line-clamp-1'
          >
            {row.original.title}
          </Link>
          <FrontendLink
            href={getCoursePublicUrl(row.original.id, row.original.type)}
            className='text-xs'
          >
            前台
          </FrontendLink>
        </div>
        <span className='text-muted-foreground text-xs'>
          {row.original.typeLabel}
        </span>
      </div>
    ),
    meta: {
      label: '课程名称',
      placeholder: '搜索课程...',
      variant: 'text' as const,
      icon: Icons.text
    },
    size: 220,
    enableColumnFilter: true
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: '课程类型',
    cell: ({ row }) => row.original.typeLabel,
    enableColumnFilter: true,
    meta: {
      label: '课程类型',
      variant: 'select' as const,
      options: COURSE_TYPE_OPTIONS
    }
  },
  {
    id: 'trainerName',
    accessorKey: 'trainerName',
    header: '所属专家',
    cell: ({ row }) => row.original.trainerName || '-',
    enableColumnFilter: true,
    meta: {
      label: '专家姓名',
      placeholder: '按专家姓名搜索...',
      variant: 'text' as const,
      icon: Icons.user
    }
  },
  {
    id: 'publisherType',
    accessorKey: 'publisherDisplayName',
    header: '发布方',
    cell: ({ row }) => row.original.publisherDisplayName || row.original.publisherType || '-',
    enableColumnFilter: true,
    meta: {
      label: '发布方类型',
      variant: 'select' as const,
      options: [
        { value: 'TRAINER', label: '专家' },
        { value: 'ASSISTANT', label: '专家助理' },
        { value: 'AGENT', label: '专家经纪人' },
        { value: 'ENTERPRISE_AGENT', label: '专家经纪公司' },
        { value: 'INSTITUTION', label: '机构' },
        { value: 'INSTITUTION_EMPLOYEE', label: '机构员工' }
      ]
    }
  },
  {
    accessorKey: 'categoryName',
    header: '分类',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'price',
    header: '价格',
    cell: ({ row }) => {
      if (row.original.isFree === 1) return <Badge variant='outline'>免费</Badge>;
      const p = row.original.price;
      return p > 0 ? `¥${Number(p).toLocaleString()}` : '-';
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const status = row.original.status;
      const isOverdue = row.original.isOverdue;
      const label =
        status === 2 && isOverdue
          ? `${COURSE_STATUS_MAP[status] ?? '未知'} · 已过期`
          : (COURSE_STATUS_MAP[status] ?? '未知');
      return (
        <Badge variant={statusVariant(status)}>
          <span className={status === 2 && isOverdue ? 'text-muted-foreground' : undefined}>
            {label}
          </span>
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: COURSE_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'isFeatured',
    header: '主打',
    cell: ({ cell }) =>
      cell.getValue<number>() === 1 ? (
        <Icons.star className='h-4 w-4 fill-amber-400 text-amber-400' />
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
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
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
