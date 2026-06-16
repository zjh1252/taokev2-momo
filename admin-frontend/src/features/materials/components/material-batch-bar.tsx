'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BATCH_ACTION_OPTIONS, type BatchAction } from '../constants';
import { batchOperateMaterials } from '../api/service';
import { materialKeys } from '../api/queries';
import type { Material } from '../api/types';

type MaterialBatchBarProps = {
  selectedIds: number[];
  selectedItems: Material[];
  onClear: () => void;
};

export function MaterialBatchBar({
  selectedIds,
  selectedItems,
  onClear
}: MaterialBatchBarProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<BatchAction>('ENABLE');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasDefault = selectedItems.some((item) => item.isDefault);
  const needsConfirm =
    action === 'DELETE' ||
    action === 'DISABLE' ||
    (hasDefault && (action === 'DELETE' || action === 'DISABLE' || action === 'UNSET_DEFAULT'));

  const mutation = useMutation({
    mutationFn: () => batchOperateMaterials({ ids: selectedIds, action }),
    onSuccess: () => {
      toast.success('批量操作成功');
      setConfirmOpen(false);
      onClear();
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
    onError: (err: Error) => toast.error(err.message || '批量操作失败')
  });

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选素材');
      return;
    }
    if (needsConfirm) {
      setConfirmOpen(true);
      return;
    }
    mutation.mutate();
  };

  const confirmDescription =
    hasDefault && (action === 'DELETE' || action === 'DISABLE')
      ? '所选素材中包含平台默认素材，操作后将不再自动展示，是否继续？'
      : `确定对 ${selectedIds.length} 个素材执行「${
          BATCH_ACTION_OPTIONS.find((o) => o.value === action)?.label
        }」吗？`;

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutate()}
        loading={mutation.isPending}
        title='确认操作'
        description={confirmDescription}
      />

      <div className='flex flex-wrap items-center gap-4 rounded-lg border bg-muted/40 p-3'>
        <span className='text-muted-foreground text-sm'>
          已选 {selectedIds.length} 项
        </span>
        <RadioGroup
          value={action}
          onValueChange={(v) => setAction(v as BatchAction)}
          className='flex flex-wrap gap-4'
        >
          {BATCH_ACTION_OPTIONS.map((item) => (
            <div key={item.value} className='flex items-center gap-2'>
              <RadioGroupItem value={item.value} id={`batch-${item.value}`} />
              <Label htmlFor={`batch-${item.value}`}>{item.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button size='sm' onClick={handleSubmit} isLoading={mutation.isPending}>
          提交
        </Button>
      </div>
    </>
  );
}
