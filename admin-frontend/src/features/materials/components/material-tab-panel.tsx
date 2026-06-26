'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import {
  AVATAR_SCENE_OPTIONS,
  COVER_CATEGORY_OPTIONS,
  COVER_SCENE_OPTIONS,
  DEFAULT_FILTER_OPTIONS,
  type MaterialType
} from '../constants';
import {
  createPendingMaterial,
  MAX_BATCH_FILES,
  MAX_FILE_SIZE_MB,
  validateImageFiles
} from '../material-utils';
import type { PendingMaterial } from '../material-utils';
import { materialsQueryOptions } from '../api/queries';
import { MaterialBatchBar } from './material-batch-bar';
import { MaterialBatchPreviewDialog } from './material-batch-preview-dialog';
import { MaterialGridView } from './material-grid-view';
import { MaterialsTable } from './materials-table';

type MaterialTabPanelProps = {
  materialType: MaterialType;
};

function MaterialTabPanel({ materialType }: MaterialTabPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingMaterial[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20),
    name: parseAsString,
    category: parseAsString,
    scene: parseAsString,
    isDefault: parseAsString
  });

  const prevPageRef = useRef(params.page);

  useEffect(() => {
    if (prevPageRef.current !== params.page) {
      prevPageRef.current = params.page;
      setSelectedIds([]);
    }
  }, [params.page]);

  const filters = {
    page: params.page,
    limit: params.perPage,
    materialType,
    ...(params.name && { keyword: params.name }),
    ...(params.category && { category: params.category }),
    ...(params.scene && { scene: params.scene }),
    ...(params.isDefault && { isDefault: params.isDefault })
  };

  const {
    data: resp,
    isPending,
    isError,
    error,
    refetch
  } = useQuery(materialsQueryOptions(filters));
  const list = resp?.data?.list ?? [];
  const total = resp?.data?.total ?? 0;
  const pageCount = Math.ceil(total / params.perPage) || 1;

  const selectedItems = list.filter((item) => selectedIds.includes(item.id));
  const allSelected = list.length > 0 && selectedIds.length === list.length;

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? list.map((item) => item.id) : []);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files?.length) return;

    const valid = validateImageFiles(files);
    const skipped = Array.from(files).length - valid.length;
    if (skipped > 0) {
      toast.error(`${skipped} 个文件超过 ${MAX_FILE_SIZE_MB}MB，已跳过`);
    }
    if (valid.length === 0) return;

    const limited = valid.slice(0, MAX_BATCH_FILES);
    if (limited.length < valid.length) {
      toast.error(`最多批量上传 ${MAX_BATCH_FILES} 张`);
    }

    setPendingItems(limited.map((file) => createPendingMaterial(file, materialType)));
    setPreviewOpen(true);
  };

  const filterCols = materialType === 'COVER' ? 'md:grid-cols-5' : 'md:grid-cols-4';

  if (isPending) {
    return <Skeleton className='h-64 w-full' />;
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center'>
        <p className='text-muted-foreground text-sm'>
          {error instanceof Error ? error.message : '素材列表加载失败'}
        </p>
        <Button size='sm' variant='outline' onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/jpg'
        className='hidden'
        multiple
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />

      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className={`grid flex-1 gap-3 ${filterCols}`}>
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
            <>
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

              <div className='space-y-1'>
                <Label>适用场景</Label>
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
                    <SelectValue placeholder='全部场景' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部场景</SelectItem>
                    {COVER_SCENE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
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
          <Button size='sm' onClick={() => fileInputRef.current?.click()}>
            <Icons.add className='mr-1 h-4 w-4' />
            批量上传
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

      <MaterialBatchBar
        materialType={materialType}
        selectedIds={selectedIds}
        selectedItems={selectedItems}
        totalCount={list.length}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
      />

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

      <MaterialBatchPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        materialType={materialType}
        items={pendingItems}
        onItemsChange={setPendingItems}
      />
    </div>
  );
}

export { MaterialTabPanel };
