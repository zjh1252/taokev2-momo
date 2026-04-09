'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminEnterpriseBuyer } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';

export const columns: ColumnDef<AdminEnterpriseBuyer>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'companyName',
    header: ({ column }: { column: Column<AdminEnterpriseBuyer, unknown> }) => (
      <DataTableColumnHeader column={column} title='公司名称' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.companyName || '-'}
        </span>
        {row.original.contactPhone && (
          <span className='text-muted-foreground text-xs'>
            {row.original.contactPhone}
          </span>
        )}
      </div>
    ),
    meta: {
      label: '公司名称',
      placeholder: '搜索公司...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'industry',
    header: '所属行业',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'companySize',
    header: '公司规模',
    cell: ({ cell }) => cell.getValue<string>() || '-'
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
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '-';
      return new Date(val).toLocaleDateString('zh-CN');
    }
  }
];
