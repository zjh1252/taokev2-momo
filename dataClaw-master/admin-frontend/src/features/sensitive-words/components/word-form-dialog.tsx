'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { SensitiveWord } from '../api/types';
import { CATEGORY_OPTIONS } from '../api/types';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createSensitiveWord,
  updateSensitiveWord
} from '../api/service';
import { sensitiveWordKeys } from '../api/queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: SensitiveWord | null;
}

export function SensitiveWordFormDialog({
  open,
  onOpenChange,
  editData
}: Props) {
  const isEdit = !!editData;
  const queryClient = useQueryClient();

  const [word, setWord] = useState('');
  const [category, setCategory] = useState<string>('0');
  const [replacement, setReplacement] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (editData) {
      setWord(editData.word);
      setCategory(String(editData.category ?? 0));
      setReplacement(editData.replacement ?? '');
      setEnabled(editData.enabled);
    } else {
      setWord('');
      setCategory('0');
      setReplacement('');
      setEnabled(true);
    }
  }, [editData, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        word,
        category: Number(category),
        replacement: replacement || null,
        enabled
      };
      return isEdit
        ? updateSensitiveWord(editData!.id, payload)
        : createSensitiveWord(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? '已更新' : '已新增');
      onOpenChange(false);
      void queryClient.invalidateQueries({
        queryKey: sensitiveWordKeys.all
      });
    },
    onError: () => toast.error('操作失败')
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑敏感词' : '新增敏感词'}</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='word'>敏感词</Label>
            <Input
              id='word'
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder='请输入敏感词'
            />
          </div>
          <div className='grid gap-2'>
            <Label>分类</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='replacement'>替换词（可选）</Label>
            <Input
              id='replacement'
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder='留空则默认用 * 替换'
            />
          </div>
          <div className='flex items-center gap-3'>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>{enabled ? '启用' : '禁用'}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!word.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? '提交中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
