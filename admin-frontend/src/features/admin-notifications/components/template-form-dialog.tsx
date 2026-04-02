'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { createTemplateMutation, updateTemplateMutation } from '../api/mutations';
import type { NotificationTemplate } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: NotificationTemplate;
}

/**
 * 通知模板新增/编辑弹窗。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
export function TemplateFormDialog({ open, onOpenChange, template }: Props) {
  const isEdit = !!template;

  const [form, setForm] = useState({
    code: '',
    channel: 'in_app',
    lang: 'zh-CN',
    titleTemplate: '',
    contentTemplate: '',
    enabled: 1,
    remark: ''
  });

  useEffect(() => {
    if (template) {
      setForm({
        code: template.code,
        channel: template.channel,
        lang: template.lang,
        titleTemplate: template.titleTemplate ?? '',
        contentTemplate: template.contentTemplate,
        enabled: template.enabled,
        remark: template.remark ?? ''
      });
    } else {
      setForm({
        code: '',
        channel: 'in_app',
        lang: 'zh-CN',
        titleTemplate: '',
        contentTemplate: '',
        enabled: 1,
        remark: ''
      });
    }
  }, [template, open]);

  const createMut = useMutation({
    ...createTemplateMutation,
    onSuccess: () => {
      toast.success('创建成功');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '创建失败')
  });

  const updateMut = useMutation({
    ...updateTemplateMutation,
    onSuccess: () => {
      toast.success('更新成功');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '更新失败')
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error('请填写模板编码');
      return;
    }
    if (!form.contentTemplate.trim()) {
      toast.error('请填写内容模板');
      return;
    }
    const payload = {
      code: form.code.trim(),
      channel: form.channel,
      lang: form.lang,
      titleTemplate: form.titleTemplate || undefined,
      contentTemplate: form.contentTemplate,
      enabled: form.enabled,
      remark: form.remark || undefined
    };
    if (isEdit) {
      updateMut.mutate({ id: template!.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑模板' : '新增模板'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改通知模板信息' : '创建新的通知模板，支持 {{变量}} 占位符'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>模板编码 *</Label>
              <Input
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                placeholder="如 APPLY_PASSED"
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>渠道</Label>
              <Select value={form.channel} onValueChange={(v) => set('channel', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">站内信</SelectItem>
                  <SelectItem value="sms">短信</SelectItem>
                  <SelectItem value="email">邮件</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>语言</Label>
              <Select value={form.lang} onValueChange={(v) => set('lang', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="en-US">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={String(form.enabled)}
                onValueChange={(v) => set('enabled', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>标题模板</Label>
            <Input
              value={form.titleTemplate}
              onChange={(e) => set('titleTemplate', e.target.value)}
              placeholder="支持 {{变量}} 占位符"
            />
          </div>
          <div className="space-y-2">
            <Label>内容模板 *</Label>
            <Textarea
              value={form.contentTemplate}
              onChange={(e) => set('contentTemplate', e.target.value)}
              placeholder="支持 {{变量}} 占位符"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>备注</Label>
            <Input
              value={form.remark}
              onChange={(e) => set('remark', e.target.value)}
              placeholder="可选"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '提交中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
