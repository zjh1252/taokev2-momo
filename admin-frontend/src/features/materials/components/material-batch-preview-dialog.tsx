'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssetImage } from '@/components/admin/asset-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  AVATAR_SCENE_MAP,
  COVER_SCENE_MAP,
  type MaterialType
} from '../constants';
import { uploadMaterials } from '../api/service';
import { materialKeys } from '../api/queries';
import type { PendingMaterial } from '../material-utils';
import { MaterialBatchControls } from './material-batch-controls';
import { MaterialFormDialog } from './material-form-dialog';

type MaterialBatchPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialType: MaterialType;
  items: PendingMaterial[];
  onItemsChange: (items: PendingMaterial[]) => void;
};

export function MaterialBatchPreviewDialog({
  open,
  onOpenChange,
  materialType,
  items,
  onItemsChange
}: MaterialBatchPreviewDialogProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editItem, setEditItem] = useState<PendingMaterial | null>(null);

  const previewUrls = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(item.tempId, URL.createObjectURL(item.file));
    }
    return map;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewUrls]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setEditItem(null);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.tempId === id)));
  }, [items]);

  const sceneMap = materialType === 'COVER' ? COVER_SCENE_MAP : AVATAR_SCENE_MAP;
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelection = (tempId: string) => {
    setSelectedIds((prev) =>
      prev.includes(tempId)
        ? prev.filter((id) => id !== tempId)
        : [...prev, tempId]
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.tempId) : []);
  };

  const updateSelectedItems = (
    updater: (item: PendingMaterial) => PendingMaterial
  ) => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选素材');
      return;
    }
    onItemsChange(
      items.map((item) =>
        selectedIds.includes(item.tempId) ? updater(item) : item
      )
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) {
        throw new Error('没有可保存的素材');
      }
      for (const item of items) {
        if (!item.name.trim()) {
          throw new Error('素材名称不能为空');
        }
      }
      await uploadMaterials(
        items.map((item) => ({
          file: item.file,
          materialType,
          name: item.name.trim().slice(0, 50),
          category: materialType === 'COVER' ? item.category : undefined,
          scene: item.scene,
          enabled: item.enabled,
          isDefault: item.isDefault
        }))
      );
    },
    onSuccess: () => {
      toast.success(`已新增 ${items.length} 个素材`);
      onOpenChange(false);
      onItemsChange([]);
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
    onError: (err: Error) => toast.error(err.message || '保存失败')
  });

  const handleDiscard = () => {
    onOpenChange(false);
    onItemsChange([]);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onItemsChange([]);
          onOpenChange(next);
        }}
      >
        <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>批量预览列表</DialogTitle>
          </DialogHeader>

          <MaterialBatchControls
            materialType={materialType}
            selectedCount={selectedIds.length}
            totalCount={items.length}
            allSelected={allSelected}
            onToggleAll={toggleAll}
            onApplyCategory={(category) =>
              updateSelectedItems((item) => ({ ...item, category }))
            }
            onApplyScene={(scene) =>
              updateSelectedItems((item) => ({ ...item, scene }))
            }
            onBatchEnable={() =>
              updateSelectedItems((item) => ({ ...item, enabled: true }))
            }
            onBatchDisable={() =>
              updateSelectedItems((item) => ({ ...item, enabled: false }))
            }
            onBatchDelete={() => {
              const selectedSet = new Set(selectedIds);
              onItemsChange(items.filter((item) => !selectedSet.has(item.tempId)));
            }}
          />

          <div className='min-h-0 flex-1 overflow-y-auto rounded-md border p-3'>
            {items.length === 0 ? (
              <p className='text-muted-foreground py-10 text-center text-sm'>
                暂无待入库素材
              </p>
            ) : (
              <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4'>
                {items.map((item) => {
                  const checked = selectedIds.includes(item.tempId);
                  const previewUrl = previewUrls.get(item.tempId) ?? '';

                  return (
                    <ContextMenu key={item.tempId}>
                      <ContextMenuTrigger asChild>
                        <div
                          className='space-y-2 rounded-lg border p-2'
                          onDoubleClick={() => setEditItem(item)}
                        >
                          <div className='flex items-center justify-between'>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSelection(item.tempId)}
                            />
                            <span className='text-muted-foreground text-xs'>
                              {item.enabled ? '已启用' : '已禁用'}
                            </span>
                          </div>

                          <div
                            className={`relative mx-auto overflow-hidden bg-muted ${
                              materialType === 'AVATAR'
                                ? 'h-24 w-24 rounded-full'
                                : 'aspect-[5/3] w-full rounded-md'
                            }`}
                          >
                            <AssetImage
                              src={previewUrl}
                              alt={item.name}
                              fill
                              wrapperClassName={
                                materialType === 'AVATAR'
                                  ? 'h-24 w-24 rounded-full'
                                  : 'aspect-[5/3] w-full rounded-md'
                              }
                              className='object-cover'
                            />
                          </div>

                          <p className='truncate text-sm font-medium'>{item.name}</p>
                          <p className='text-muted-foreground truncate text-xs'>
                            {materialType === 'COVER'
                              ? `${item.category} · ${sceneMap[item.scene] ?? item.scene}`
                              : sceneMap[item.scene] ?? item.scene}
                          </p>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => setEditItem(item)}>
                          编辑素材
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button type='button' variant='outline' onClick={handleDiscard}>
              取消丢弃全部
            </Button>
            <Button
              type='button'
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              disabled={items.length === 0}
            >
              全部保存入库
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MaterialFormDialog
        open={!!editItem}
        onOpenChange={(next) => {
          if (!next) setEditItem(null);
        }}
        materialType={materialType}
        draftItem={editItem}
        onDraftSave={(updated) => {
          onItemsChange(
            items.map((item) =>
              item.tempId === updated.tempId ? updated : item
            )
          );
          setEditItem(null);
        }}
      />
    </>
  );
}
