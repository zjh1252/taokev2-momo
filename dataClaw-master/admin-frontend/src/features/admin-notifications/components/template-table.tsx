'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { templateListQueryOptions } from '../api/queries';
import { deleteTemplateMutation } from '../api/mutations';
import { TemplateFormDialog } from './template-form-dialog';
import type { NotificationTemplate } from '../api/types';

const CHANNEL_LABELS: Record<string, string> = {
  in_app: '站内信',
  sms: '短信',
  email: '邮件'
};

/**
 * 通知模板管理表格。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
export function TemplateTable() {
  const { data, isLoading } = useQuery(templateListQueryOptions);
  const templates: NotificationTemplate[] = data?.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<NotificationTemplate | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deleteMut = useMutation({
    ...deleteTemplateMutation,
    onSuccess: () => {
      toast.success('删除成功');
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message || '删除失败')
  });

  const handleAdd = () => {
    setEditTemplate(undefined);
    setFormOpen(true);
  };

  const handleEdit = (tpl: NotificationTemplate) => {
    setEditTemplate(tpl);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <IconPlus className="mr-2 size-4" />
          新增模板
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">模板编码</TableHead>
              <TableHead className="w-[80px]">渠道</TableHead>
              <TableHead className="w-[80px]">语言</TableHead>
              <TableHead>标题模板</TableHead>
              <TableHead className="max-w-[200px]">内容模板</TableHead>
              <TableHead className="w-[70px]">状态</TableHead>
              <TableHead className="w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  暂无模板
                </TableCell>
              </TableRow>
            ) : (
              templates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-mono text-sm">{tpl.code}</TableCell>
                  <TableCell>{CHANNEL_LABELS[tpl.channel] ?? tpl.channel}</TableCell>
                  <TableCell>{tpl.lang}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {tpl.titleTemplate ?? '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {tpl.contentTemplate}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tpl.enabled === 1 ? 'default' : 'secondary'}>
                      {tpl.enabled === 1 ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tpl)}
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(tpl.id)}
                      >
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editTemplate}
      />

      <AlertModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="删除模板"
        description="确认删除此通知模板？此操作不可恢复。"
      />
    </div>
  );
}
