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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { MaterialType } from '../../constants';
import {
  deleteMaterial,
  setMaterialDefault,
  setMaterialEnabled
} from '../../api/service';
import { materialKeys } from '../../api/queries';
import type { Material } from '../../api/types';
import { MaterialFormDialog } from '../material-form-dialog';

type CellActionProps = {
  data: Material;
  materialType: MaterialType;
};

export function CellAction({ data, materialType }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: materialKeys.all });
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteMaterial(data.id),
    onSuccess: () => {
      toast.success('已删除');
      setDeleteOpen(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || '删除失败')
  });

  const enabledMutation = useMutation({
    mutationFn: () => setMaterialEnabled(data.id, !data.enabled),
    onSuccess: () => {
      toast.success(data.enabled ? '已禁用' : '已启用');
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const defaultMutation = useMutation({
    mutationFn: () => setMaterialDefault(data.id, !data.isDefault),
    onSuccess: () => {
      toast.success(data.isDefault ? '已取消默认' : '已设为默认');
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const deleteDescription = data.isDefault
    ? '该素材为平台默认素材，删除后将不再自动展示，是否继续？'
    : `确定要删除素材「${data.name}」吗？`;

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title='确认删除'
        description={deleteDescription}
      />

      <MaterialFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        materialType={materialType}
        editData={data}
      />

      <div className='flex flex-wrap gap-1'>
        <Button size='sm' variant='outline' onClick={() => setEditOpen(true)}>
          编辑
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => enabledMutation.mutate()}
          disabled={enabledMutation.isPending}
        >
          {data.enabled ? '禁用' : '启用'}
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => defaultMutation.mutate()}
          disabled={defaultMutation.isPending}
        >
          {data.isDefault ? '取消默认' : '设为默认'}
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <Icons.ellipsis className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>更多</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Icons.trash className='mr-2 h-4 w-4' />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
