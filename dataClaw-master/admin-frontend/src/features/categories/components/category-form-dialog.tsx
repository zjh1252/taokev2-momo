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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createCategoryMutation, updateCategoryMutation } from '../api/mutations';
import type { CategoryNode, SaveCategoryPayload, UpdateCategoryPayload } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryType: string;
  category?: CategoryNode;
  defaultParentId?: number;
}

/**
 * 新增/编辑分类弹窗。
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  categoryType,
  category,
  defaultParentId = 0
}: Props) {
  const isEdit = !!category;

  const [form, setForm] = useState({
    name: '',
    sortOrder: 0,
    isVisible: 1,
    description: ''
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        sortOrder: category.sortOrder,
        isVisible: category.isVisible,
        description: category.description ?? ''
      });
    } else {
      setForm({
        name: '',
        sortOrder: 0,
        isVisible: 1,
        description: ''
      });
    }
  }, [category, open]);

  const createMut = useMutation({
    ...createCategoryMutation,
    onSuccess: () => {
      toast.success('创建成功');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '创建失败')
  });

  const updateMut = useMutation({
    ...updateCategoryMutation,
    onSuccess: () => {
      toast.success('更新成功');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '更新失败')
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('请填写分类名称');
      return;
    }
    if (isEdit) {
      const payload: UpdateCategoryPayload = {
        name: form.name,
        sortOrder: form.sortOrder,
        isVisible: form.isVisible,
        description: form.description || undefined
      };
      updateMut.mutate({ id: category!.id, data: payload });
    } else {
      const payload: SaveCategoryPayload = {
        type: categoryType,
        parentId: defaultParentId,
        name: form.name,
        sortOrder: form.sortOrder,
        isVisible: form.isVisible,
        description: form.description || undefined
      };
      createMut.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑分类' : '新增分类'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改分类信息' : defaultParentId > 0 ? '添加子分类' : '添加顶级分类'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>分类名称 *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="请输入分类名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>排序</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>可见性</Label>
              <Select
                value={String(form.isVisible)}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, isVisible: parseInt(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">可见</SelectItem>
                  <SelectItem value="0">隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>描述</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="可选"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
