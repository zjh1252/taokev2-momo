'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminInstitution } from '../../api/types';
import { INSTITUTION_STATUS_MAP, INSTITUTION_STATUS_OPTIONS } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { FrontendLink } from '@/components/admin/frontend-link';
import { getInstitutionPublicUrl } from '@/lib/frontend-links';
import { Icons } from '@/components/icons';
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

export const columns: ColumnDef<AdminInstitution>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'orgName',
    header: ({ column }: { column: Column<AdminInstitution, unknown> }) => (
      <DataTableColumnHeader column={column} title='机构名称' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <FrontendLink href={getInstitutionPublicUrl(row.original.id)} className='font-medium'>
          {row.original.orgName || '-'}
        </FrontendLink>
        {row.original.contactPhone && (
          <span className='text-muted-foreground text-xs'>
            {row.original.contactPhone}
          </span>
        )}
      </div>
    ),
    meta: {
      label: '机构名称',
      placeholder: '搜索机构...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'contactName',
    header: '联系人',
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
          {INSTITUTION_STATUS_MAP[status] ?? '未知'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: INSTITUTION_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'association',
    header: '培训协会',
    cell: ({ cell }) => {
      const val = cell.getValue<boolean>();
      return val ? (
        <Badge variant='default'>是</Badge>
      ) : (
        <span className='text-muted-foreground'>否</span>
      );
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
