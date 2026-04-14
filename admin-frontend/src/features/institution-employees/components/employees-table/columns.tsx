'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { AdminInstitutionEmployee } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';

export const columns: ColumnDef<AdminInstitutionEmployee>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'orgName',
    header: ({ column }: { column: Column<AdminInstitutionEmployee, unknown> }) => (
      <DataTableColumnHeader column={column} title='所属机构' />
    ),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.orgName || '-'}</span>
    ),
    meta: {
      label: '所属机构',
      placeholder: '搜索...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'position',
    header: '职位',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'department',
    header: '部门',
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
