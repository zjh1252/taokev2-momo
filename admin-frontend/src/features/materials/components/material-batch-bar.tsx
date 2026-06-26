'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { type MaterialType } from '../constants';
import { batchOperateMaterials, updateMaterial } from '../api/service';
import { materialKeys } from '../api/queries';
import type { Material } from '../api/types';
import { MaterialBatchControls } from './material-batch-controls';

type MaterialBatchBarProps = {
  materialType: MaterialType;
  selectedIds: number[];
  selectedItems: Material[];
  totalCount: number;
  allSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onClear: () => void;
};

export function MaterialBatchBar({
  materialType,
  selectedIds,
  selectedItems,
  totalCount,
  allSelected,
  onToggleAll,
  onClear
}: MaterialBatchBarProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'DELETE' | 'DISABLE' | 'UNSET_DEFAULT' | null
  >(null);

  const hasDefault = selectedItems.some((item) => item.isDefault);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: materialKeys.all });
  };

  const batchMutation = useMutation({
    mutationFn: (action: string) =>
      batchOperateMaterials({ ids: selectedIds, action }),
    onSuccess: (_data, action) => {
      toast.success(action === 'DELETE' ? '批量删除成功' : '批量操作成功');
      setConfirmOpen(false);
      setPendingAction(null);
      onClear();
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || '批量操作失败')
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      category?: string;
      scene?: string;
      enabled?: boolean;
    }) => {
      await Promise.all(
        selectedIds.map((id) => updateMaterial(id, updates))
      );
    },
    onSuccess: () => {
      toast.success('批量更新成功');
      onClear();
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || '批量更新失败')
  });

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选素材');
      return;
    }
    setPendingAction('DELETE');
    setConfirmOpen(true);
  };

  const runExtraAction = (action: 'SET_DEFAULT' | 'UNSET_DEFAULT') => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选素材');
      return;
    }
    if (hasDefault && action === 'UNSET_DEFAULT') {
      setPendingAction('UNSET_DEFAULT');
      setConfirmOpen(true);
      return;
    }
    batchMutation.mutate(action);
  };

  const handleBatchDisable = () => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选素材');
      return;
    }
    if (hasDefault) {
      setPendingAction('DISABLE');
      setConfirmOpen(true);
      return;
    }
    updateMutation.mutate({ enabled: false });
  };

  const handleConfirm = () => {
    if (pendingAction === 'DISABLE') {
      updateMutation.mutate(
        { enabled: false },
        {
          onSuccess: () => {
            toast.success('批量更新成功');
            setConfirmOpen(false);
            setPendingAction(null);
            onClear();
            invalidate();
          }
        }
      );
      return;
    }
    if (pendingAction) {
      batchMutation.mutate(pendingAction);
    }
  };

  const confirmDescription =
    pendingAction === 'DELETE' && hasDefault
      ? '所选素材中包含平台默认素材，删除后将不再自动展示，是否继续？'
      : pendingAction === 'DISABLE' && hasDefault
        ? '所选素材中包含平台默认素材，禁用后将不再自动展示，是否继续？'
        : pendingAction === 'DELETE'
          ? `确定删除 ${selectedIds.length} 个素材吗？`
          : `确定对 ${selectedIds.length} 个素材执行此操作吗？`;

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirm}
        loading={batchMutation.isPending || updateMutation.isPending}
        title='确认操作'
        description={confirmDescription}
      />

      <div className='space-y-3 rounded-lg border bg-muted/40 p-3'>
        <MaterialBatchControls
          materialType={materialType}
          selectedCount={selectedIds.length}
          totalCount={totalCount}
          allSelected={allSelected}
          onToggleAll={onToggleAll}
          onApplyCategory={(category) => {
            if (selectedIds.length === 0) return;
            updateMutation.mutate({ category });
          }}
          onApplyScene={(scene) => {
            if (selectedIds.length === 0) return;
            updateMutation.mutate({ scene });
          }}
          onBatchEnable={() => {
            if (selectedIds.length === 0) return;
            updateMutation.mutate({ enabled: true });
          }}
          onBatchDisable={handleBatchDisable}
          onBatchDelete={handleBatchDelete}
        />

        <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                更多操作
                <Icons.chevronDown className='ml-1 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuItem onClick={() => runExtraAction('SET_DEFAULT')}>
                设为默认
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runExtraAction('UNSET_DEFAULT')}>
                取消默认
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
