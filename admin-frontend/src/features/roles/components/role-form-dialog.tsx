'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { createRoleMutation, updateRoleMutation } from '../api/mutations';
import type { Role, SaveRolePayload } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
}

export function RoleFormDialog({ open, onOpenChange, role }: Props) {
  const isEdit = !!role;

  const [form, setForm] = useState<SaveRolePayload>({
    roleCode: '',
    roleName: '',
    description: '',
    isActive: 1
  });

  useEffect(() => {
    if (role) {
      setForm({
        roleCode: role.roleCode,
        roleName: role.roleName,
        description: role.description ?? '',
        isActive: role.isActive
      });
    } else {
      setForm({ roleCode: '', roleName: '', description: '', isActive: 1 });
    }
  }, [role, open]);

  const createMut = useMutation({
    ...createRoleMutation,
    onSuccess: () => {
      toast.success('创建成功');
      onOpenChange(false);
    },
    onError: () => toast.error('创建失败')
  });

  const updateMut = useMutation({
    ...updateRoleMutation,
    onSuccess: () => {
      toast.success('更新成功');
      onOpenChange(false);
    },
    onError: () => toast.error('更新失败')
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roleCode || !form.roleName) {
      toast.error('请填写必填项');
      return;
    }
    if (isEdit) {
      updateMut.mutate({ id: role!.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色信息' : '创建新的 RBAC 角色'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label>角色编码 *</Label>
            <Input
              value={form.roleCode}
              onChange={(e) => setForm((p) => ({ ...p, roleCode: e.target.value }))}
              placeholder='如 CONTENT_EDITOR'
              disabled={isEdit && role?.isSystem === 1}
            />
          </div>
          <div className='space-y-2'>
            <Label>角色名称 *</Label>
            <Input
              value={form.roleName}
              onChange={(e) => setForm((p) => ({ ...p, roleName: e.target.value }))}
              placeholder='如 内容编辑'
            />
          </div>
          <div className='space-y-2'>
            <Label>描述</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder='可选'
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label>启用状态</Label>
            <Switch
              checked={form.isActive === 1}
              onCheckedChange={(checked) =>
                setForm((p) => ({ ...p, isActive: checked ? 1 : 0 }))
              }
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
