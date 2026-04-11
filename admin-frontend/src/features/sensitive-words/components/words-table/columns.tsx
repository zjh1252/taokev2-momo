'use client';
import { Badge } from '@/components/ui/badge';
import type { SensitiveWord } from '../../api/types';
import { CATEGORY_MAP } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SensitiveWord>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: false
  },
  {
    accessorKey: 'word',
    header: '敏感词',
    cell: ({ cell }) => (
      <span className='font-medium'>{cell.getValue<string>()}</span>
    )
  },
  {
    accessorKey: 'category',
    header: '分类',
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
    accessorKey: 'enabled',
    header: '状态',
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
