'use client';

import { AssetImage } from '@/components/admin/asset-image';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AVATAR_SCENE_MAP,
  COVER_CATEGORY_OPTIONS,
  COVER_SCENE_MAP,
  ENABLED_FILTER_OPTIONS,
  type MaterialType
} from '../../constants';
import type { Material } from '../../api/types';
import { CellAction } from './cell-action';

const categoryOptions = COVER_CATEGORY_OPTIONS.map((item) => ({
  value: item,
  label: item
}));

export function buildMaterialColumns(materialType: MaterialType): ColumnDef<Material>[] {
  const sceneMap = materialType === 'COVER' ? COVER_SCENE_MAP : AVATAR_SCENE_MAP;

  const columns: ColumnDef<Material>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='全选'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='选择'
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      id: 'preview',
      header: '预览',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <AssetImage
            src={item.url}
            alt={item.name}
            fill
            wrapperClassName={
              materialType === 'AVATAR'
                ? 'h-10 w-10 rounded-full'
                : 'h-10 w-16 rounded'
            }
            className='object-cover'
          />
        );
      }
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: '素材名称',
      enableColumnFilter: true,
      meta: {
        label: '素材名称',
        placeholder: '搜索素材名称...',
        variant: 'text' as const,
        icon: Icons.text
      }
    }
  ];

  if (materialType === 'COVER') {
    columns.push({
      id: 'category',
      accessorKey: 'category',
      header: '素材分类',
      enableColumnFilter: true,
      meta: {
        label: '素材分类',
        variant: 'select' as const,
        options: categoryOptions
      }
    });
    columns.push({
      accessorKey: 'scene',
      header: '适用场景',
      cell: ({ cell }) => sceneMap[cell.getValue<string>()] ?? cell.getValue<string>()
    });
  } else {
    columns.push({
      id: 'scene',
      accessorKey: 'scene',
      header: '素材类型',
      enableColumnFilter: true,
      meta: {
        label: '素材类型',
        variant: 'select' as const,
        options: [
          { value: 'TRAINER', label: '专家头像' },
          { value: 'INSTITUTION', label: '机构头像' }
        ]
      },
      cell: ({ cell }) => sceneMap[cell.getValue<string>()] ?? cell.getValue<string>()
    });
  }

  columns.push(
    {
      accessorKey: 'isDefault',
      header: '默认标识',
      cell: ({ cell }) => (
        <Badge variant={cell.getValue<boolean>() ? 'default' : 'outline'}>
          {cell.getValue<boolean>() ? '默认素材' : '非默认素材'}
        </Badge>
      )
    },
    {
      accessorKey: 'usageCount',
      header: '使用次数'
    },
    {
      accessorKey: 'createdAt',
      header: '上传时间',
      cell: ({ cell }) => {
        const val = cell.getValue<string>();
        return val ? new Date(val).toLocaleString('zh-CN') : '-';
      }
    },
    {
      id: 'enabled',
      accessorKey: 'enabled',
      header: '状态',
      enableColumnFilter: true,
      meta: {
        label: '状态',
        variant: 'select' as const,
        options: ENABLED_FILTER_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label
        }))
      },
      cell: ({ cell }) => {
        const enabled = cell.getValue<boolean>();
        return (
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? '已启用' : '已禁用'}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: () => <Icons.settings className='h-4 w-4' />,
      cell: ({ row }) => (
        <CellAction data={row.original} materialType={materialType} />
      )
    }
  );

  return columns;
}
