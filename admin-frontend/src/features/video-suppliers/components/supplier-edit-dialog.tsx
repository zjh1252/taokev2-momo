'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { AdminVideoSupplier } from '../api/types';
import { SUPPLIER_MEMBER_TYPE_OPTIONS } from '../api/types';
import { updateVideoSupplier } from '../api/service';
import { videoSupplierKeys } from '../api/queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: AdminVideoSupplier;
}

export function SupplierEditDialog({ open, onOpenChange, supplier }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    companyName: supplier.companyName,
    memberType: supplier.memberType,
    enabled: supplier.enabled
  });

  useEffect(() => {
    if (open) {
      setForm({
        companyName: supplier.companyName,
        memberType: supplier.memberType,
        enabled: supplier.enabled
      });
    }
  }, [open, supplier]);

  const mutation = useMutation({
    mutationFn: () => updateVideoSupplier(supplier.id, form),
    onSuccess: () => {
      toast.success('保存成功');
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: videoSupplierKeys.all });
    },
    onError: () => toast.error('保存失败')
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>编辑供应商</DialogTitle>
          <DialogDescription>修改供应商基本信息，用户 ID 不可变更。</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>用户 ID</Label>
            <Input value={String(supplier.userId)} disabled readOnly />
          </div>
          <div className='space-y-2'>
            <Label>公司名称</Label>
            <Input
              value={form.companyName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, companyName: e.target.value }))
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>会员类型</Label>
            <Select
              value={form.memberType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, memberType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='选择会员类型' />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_MEMBER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center justify-between'>
            <Label>启用状态</Label>
            <Switch
              checked={form.enabled}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!form.companyName.trim()}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
