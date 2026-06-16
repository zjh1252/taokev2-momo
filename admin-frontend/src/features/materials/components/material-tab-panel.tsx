'use client';

import { Suspense, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AVATAR_SCENE_OPTIONS,
  COVER_CATEGORY_OPTIONS,
  DEFAULT_FILTER_OPTIONS,
  type MaterialType
} from '../constants';
import { materialsQueryOptions } from '../api/queries';
import { MaterialBatchBar } from './material-batch-bar';
import { MaterialFormDialog } from './material-form-dialog';
import { MaterialGridView } from './material-grid-view';
import { MaterialsTable } from './materials-table';

type MaterialTabPanelProps = {
  materialType: MaterialType;
};

function MaterialTabPanelContent({ materialType }: MaterialTabPanelProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20),
    name: parseAsString,
    category: parseAsString,
    scene: parseAsString,
    isDefault: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    materialType,
    ...(params.name && { keyword: params.name }),
    ...(params.category && { category: params.category }),
    ...(params.scene && { scene: params.scene }),
    ...(params.isDefault && { isDefault: params.isDefault })
  };

  const { data: resp } = useSuspenseQuery(materialsQueryOptions(filters));
  const list = resp.data?.list ?? [];
  const total = resp.data?.total ?? 0;
  const pageCount = Math.ceil(total / params.perPage) || 1;

  const selectedItems = list.filter((item) => selectedIds.includes(item.id));

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? list.map((item) => item.id) : []);
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='grid flex-1 gap-3 md:grid-cols-4'>
          <div className='space-y-1'>
            <Label>素材名称</Label>
            <Input
              placeholder='搜索素材名称'
              value={params.name ?? ''}
              onChange={(e) =>
                void setParams({ name: e.target.value || null, page: 1 })
              }
            />
          </div>

          {materialType === 'COVER' ? (
            <div className='space-y-1'>
              <Label>素材分类</Label>
              <Select
                value={params.category ?? 'all'}
                onValueChange={(value) =>
                  void setParams({
                    category: value === 'all' ? null : value,
                    page: 1
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='全部分类' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部分类</SelectItem>
                  {COVER_CATEGORY_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className='space-y-1'>
              <Label>素材类型</Label>
              <Select
                value={params.scene ?? 'all'}
                onValueChange={(value) =>
                  void setParams({
                    scene: value === 'all' ? null : value,
                    page: 1
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='不限' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>不限</SelectItem>
                  {AVATAR_SCENE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='space-y-1'>
            <Label>是否默认素材</Label>
            <Select
              value={params.isDefault ?? 'all'}
              onValueChange={(value) =>
                void setParams({
                  isDefault: value === 'all' ? null : value,
                  page: 1
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='全部' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                {DEFAULT_FILTER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('grid')}
          >
            网格
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('list')}
          >
            列表
          </Button>
          <Button size='sm' onClick={() => setCreateOpen(true)}>
            <Icons.add className='mr-1 h-4 w-4' />
            新增素材
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <MaterialGridView
          materialType={materialType}
          items={list}
          selectedIds={selectedIds}
          onToggle={toggleSelection}
          onToggleAll={toggleAll}
        />
      ) : (
        <MaterialsTable
          materialType={materialType}
          list={list}
          pageCount={pageCount}
          onSelectionChange={setSelectedIds}
        />
      )}

      <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-3'>
        <p className='text-muted-foreground text-sm'>
          共 {total} 条，第 {params.page}/{pageCount} 页
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={params.page <= 1}
            onClick={() => void setParams({ page: params.page - 1 })}
          >
            上一页
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={params.page >= pageCount}
            onClick={() => void setParams({ page: params.page + 1 })}
          >
            下一页
          </Button>
        </div>
      </div>

      <MaterialBatchBar
        selectedIds={selectedIds}
        selectedItems={selectedItems}
        onClear={() => setSelectedIds([])}
      />

      <MaterialFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        materialType={materialType}
      />
    </div>
  );
}

export function MaterialTabPanel(props: MaterialTabPanelProps) {
  return (
    <Suspense fallback={<Skeleton className='h-64 w-full' />}>
      <MaterialTabPanelContent {...props} />
    </Suspense>
  );
}
