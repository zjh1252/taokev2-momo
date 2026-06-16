'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateCrawlSource, useUpdateCrawlSource } from '../api/mutations';
import type { CrawlSource, SaveCrawlSourcePayload } from '../api/types';
import { DATA_TYPE_OPTIONS } from '../api/types';

type CrawlSourceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: CrawlSource | null;
};

const emptyForm = {
  code: '',
  name: '',
  url: '',
  dataType: 'TRAINER',
  enabled: true,
  sortOrder: '',
  remark: ''
};

export function CrawlSourceFormDialog({ open, onOpenChange, source }: CrawlSourceFormDialogProps) {
  const isEdit = Boolean(source);
  const createMutation = useCreateCrawlSource();
  const updateMutation = useUpdateCrawlSource();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (source) {
      setForm({
        code: source.code,
        name: source.name,
        url: source.url,
        dataType: source.dataType,
        enabled: source.enabled ?? source.status === 'AVAILABLE',
        sortOrder: source.sortOrder != null ? String(source.sortOrder) : '',
        remark: source.remark ?? ''
      });
      return;
    }
    setForm(emptyForm);
  }, [open, source]);

  const pending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    const payload: SaveCrawlSourcePayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      url: form.url.trim(),
      dataType: form.dataType,
      enabled: form.enabled,
      remark: form.remark.trim() || undefined
    };
    const sortOrder = Number(form.sortOrder);
    if (Number.isFinite(sortOrder)) {
      payload.sortOrder = sortOrder;
    }

    if (!payload.code || !payload.name || !payload.url) {
      toast.error('请填写标识、名称和站点 URL');
      return;
    }

    if (isEdit && source) {
      if (typeof source.id !== 'number' || source.id <= 0) {
        toast.error('数据源 ID 无效，请重新编译并重启 Java 后端');
        return;
      }
      updateMutation.mutate(
        { id: source.id, body: payload },
        {
          onSuccess: () => {
            toast.success('数据源已更新');
            onOpenChange(false);
          },
          onError: (error: Error) => toast.error(error.message || '更新失败')
        }
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('数据源已新增');
        onOpenChange(false);
      },
      onError: (error: Error) => toast.error(error.message || '新增失败')
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑数据源' : '新增数据源'}</DialogTitle>
          <DialogDescription>
            标识用于对接 Python 爬虫模块，命名规则为 <code>{'{code}'}_{'{type}'}</code>（如
            lmschina_trainer）。新增站点需在 crawler-service 中实现对应爬虫后才能执行抓取。
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-2'>
          <div className='grid gap-2'>
            <Label htmlFor='crawl-source-code'>标识 code</Label>
            <Input
              id='crawl-source-code'
              placeholder='例如 mysite'
              value={form.code}
              disabled={isEdit && source?.builtIn}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='crawl-source-name'>名称</Label>
            <Input
              id='crawl-source-name'
              placeholder='展示名称'
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='crawl-source-url'>站点 URL</Label>
            <Input
              id='crawl-source-url'
              placeholder='https://example.com'
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label>数据类型</Label>
            <Select
              value={form.dataType}
              disabled={isEdit && source?.builtIn}
              onValueChange={(value) => setForm((prev) => ({ ...prev, dataType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='crawl-source-sort'>排序</Label>
            <Input
              id='crawl-source-sort'
              type='number'
              placeholder='数字越小越靠前'
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='crawl-source-remark'>备注</Label>
            <Textarea
              id='crawl-source-remark'
              placeholder='可选：爬虫模块路径、对接说明等'
              value={form.remark}
              onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
            />
          </div>
          <div className='flex items-center justify-between rounded-md border px-3 py-2'>
            <div>
              <div className='text-sm font-medium'>启用</div>
              <div className='text-xs text-muted-foreground'>禁用后不可发起爬取</div>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={pending}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? <Icons.spinner className='mr-2 h-4 w-4 animate-spin' /> : null}
            {isEdit ? '保存' : '新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
