'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CATEGORY_OPTIONS } from '../api/types';
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { importSensitiveWords } from '../api/service';
import { sensitiveWordKeys } from '../api/queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('0');

  const mutation = useMutation({
    mutationFn: () => importSensitiveWords(file!, Number(category)),
    onSuccess: (res) => {
      toast.success(`成功导入 ${res.data} 个敏感词`);
      onOpenChange(false);
      setFile(null);
      void queryClient.invalidateQueries({
        queryKey: sensitiveWordKeys.all
      });
    },
    onError: () => toast.error('导入失败')
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>批量导入敏感词</DialogTitle>
          <DialogDescription>
            上传文本文件（.txt），每行一个敏感词。
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label>选择文件</Label>
            <input
              ref={fileRef}
              type='file'
              accept='.txt,.csv'
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className='block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90'
            />
          </div>
          <div className='grid gap-2'>
            <Label>导入分类</Label>
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
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!file || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? '导入中...' : '开始导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
