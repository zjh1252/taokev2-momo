'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { createPermissionMutation, updatePermissionMutation } from '../api/mutations';
import type { Permission, SavePermissionPayload } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission;
  defaultParentId?: number;
}

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
  defaultParentId = 0
}: Props) {
  const isEdit = !!permission;

  const [form, setForm] = useState<SavePermissionPayload>({
    permissionCode: '',
    permissionName: '',
    module: '',
    actionType: '',
    parentId: defaultParentId,
    sortOrder: 0,
    description: ''
  });

  useEffect(() => {
    if (permission) {
      setForm({
        permissionCode: permission.permissionCode,
        permissionName: permission.permissionName,
        module: permission.module,
        actionType: permission.actionType,
        parentId: permission.parentId,
        sortOrder: permission.sortOrder,
        description: permission.description ?? ''
      });
    } else {
      setForm({
        permissionCode: '',
        permissionName: '',
        module: '',
        actionType: '',
        parentId: defaultParentId,
        sortOrder: 0,
        description: ''
      });
    }
  }, [permission, defaultParentId, open]);

  const createMut = useMutation({
    ...createPermissionMutation,
    onSuccess: () => {
      toast.success('创建成功');
      onOpenChange(false);
    },
    onError: () => toast.error('创建失败')
  });

  const updateMut = useMutation({
    ...updatePermissionMutation,
    onSuccess: () => {
      toast.success('更新成功');
      onOpenChange(false);
    },
    onError: () => toast.error('更新失败')
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.permissionCode || !form.permissionName || !form.module || !form.actionType) {
      toast.error('请填写必填项');
      return;
    }
    if (isEdit) {
      updateMut.mutate({ id: permission!.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const update = (key: keyof SavePermissionPayload, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑权限' : '新增权限'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改权限节点信息' : '创建新的权限节点'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>权限编码 *</Label>
              <Input
                value={form.permissionCode}
                onChange={(e) => update('permissionCode', e.target.value)}
                placeholder='如 user:create'
              />
            </div>
            <div className='space-y-2'>
              <Label>权限名称 *</Label>
              <Input
                value={form.permissionName}
                onChange={(e) => update('permissionName', e.target.value)}
                placeholder='如 创建用户'
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>所属模块 *</Label>
              <Input
                value={form.module}
                onChange={(e) => update('module', e.target.value)}
                placeholder='如 user'
              />
            </div>
            <div className='space-y-2'>
              <Label>操作类型 *</Label>
              <Input
                value={form.actionType}
                onChange={(e) => update('actionType', e.target.value)}
                placeholder='如 create/read/update/delete'
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>父级 ID</Label>
              <Input
                type='number'
                value={form.parentId}
                onChange={(e) => update('parentId', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className='space-y-2'>
              <Label>排序</Label>
              <Input
                type='number'
                value={form.sortOrder}
                onChange={(e) => update('sortOrder', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>描述</Label>
            <Input
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder='可选'
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type='submit' isLoading={isPending}>
              {isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
