'use client';
import { Badge } from '@/components/ui/badge';
import type { SensitiveWord } from '../../api/types';
import { CATEGORY_MAP, CATEGORY_OPTIONS } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

const ENABLED_OPTIONS = [
  { value: 'true', label: '启用' },
  { value: 'false', label: '禁用' }
];

export const columns: ColumnDef<SensitiveWord>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'word',
    header: '敏感词',
    enableColumnFilter: true,
    meta: {
      label: '敏感词',
      placeholder: '搜索敏感词...',
      variant: 'text' as const,
      icon: Icons.text
    },
    cell: ({ cell }) => (
      <span className='font-medium'>{cell.getValue<string>()}</span>
    )
  },
  {
    id: 'category',
    accessorKey: 'category',
    header: '分类',
    enableColumnFilter: true,
    meta: {
      label: '分类',
      variant: 'select' as const,
      options: CATEGORY_OPTIONS
    },
    cell: ({ cell }) => {
      const cat = cell.getValue<number>();
      return (
        <Badge variant='outline'>
          {CATEGORY_MAP[cat] ?? '通用'}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'replacement',
    header: '替换词',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'enabled',
    accessorKey: 'enabled',
    header: '状态',
    enableColumnFilter: true,
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ENABLED_OPTIONS
    },
    cell: ({ cell }) => {
      const enabled = cell.getValue<boolean>();
      return (
        <Badge variant={enabled ? 'default' : 'secondary'}>
          {enabled ? '启用' : '禁用'}
        </Badge>
      );
    }
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
