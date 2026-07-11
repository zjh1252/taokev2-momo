'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createIndex, deleteIndex, putMapping, reindexAll, reindexByType } from '../api/service';
import { searchKeys, searchOverviewQueryOptions } from '../api/queries';
import type { ReindexResult } from '../api/types';

const DOC_TYPE_LABELS: Record<string, string> = {
  course: '课程',
  trainer: '专家'
};

function docTypeLabel(docType: string) {
  return DOC_TYPE_LABELS[docType] ?? docType;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0);
}

function formatReindexResult(result?: ReindexResult) {
  if (!result) return '重建完成';

  const counts = result.docTypes
    .map((docType) => `${docTypeLabel(docType)} ${formatNumber(result.indexedCounts?.[docType])} 条`)
    .join('，');

  return `已重建到 ${result.targetIndex}：${counts}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function SearchManagement() {
  const queryClient = useQueryClient();
  const {
    data: overviewResp,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery(searchOverviewQueryOptions());

  const overview = overviewResp?.data;
  const defaultIndex = overview?.defaultIndex ?? 'taokev2app';
  const indices = overview?.indices ?? [];
  const docTypes = overview?.docTypes ?? [];
  const totalDocuments = indices.reduce((sum, item) => sum + item.documentCount, 0);

  const [createOpen, setCreateOpen] = useState(false);
  const [newIndexName, setNewIndexName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [reindexConfirm, setReindexConfirm] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState('default');

  const requestTargetIndex = targetIndex === 'default' ? undefined : targetIndex;

  const refreshOverview = () => {
    queryClient.invalidateQueries({ queryKey: searchKeys.overview() });
    queryClient.invalidateQueries({ queryKey: searchKeys.indices() });
  };

  const createMutation = useMutation({
    mutationFn: (name?: string) => createIndex(name),
    onSuccess: (resp) => {
      toast[resp.data ? 'success' : 'info'](resp.data ? '索引创建成功' : '索引已存在');
      refreshOverview();
      setCreateOpen(false);
      setNewIndexName('');
    },
    onError: (error) => toast.error(errorMessage(error, '索引创建失败'))
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteIndex(name),
    onSuccess: () => {
      toast.success('索引删除成功');
      if (deleteTarget === targetIndex) setTargetIndex('default');
      refreshOverview();
      setDeleteTarget(null);
    },
    onError: (error) => toast.error(errorMessage(error, '索引删除失败'))
  });

  const putMappingMutation = useMutation({
    mutationFn: (name: string) => putMapping(name),
    onSuccess: (resp) => {
      toast[resp.data ? 'success' : 'info'](
        resp.data ? 'Mapping 更新成功' : '索引不存在，无需更新'
      );
    },
    onError: (error) => toast.error(errorMessage(error, 'Mapping 更新失败'))
  });

  const reindexAllMutation = useMutation({
    mutationFn: (target?: string) => reindexAll(target),
    onSuccess: (resp) => {
      toast.success(formatReindexResult(resp.data));
      refreshOverview();
      setReindexConfirm(null);
    },
    onError: (error) => toast.error(errorMessage(error, '全量重建失败'))
  });

  const reindexTypeMutation = useMutation({
    mutationFn: ({ docType, target }: { docType: string; target?: string }) =>
      reindexByType(docType, target),
    onSuccess: (resp) => {
      toast.success(formatReindexResult(resp.data));
      refreshOverview();
      setReindexConfirm(null);
    },
    onError: (error) => toast.error(errorMessage(error, '重建失败'))
  });

  const handleReindexConfirm = () => {
    if (!reindexConfirm) return;
    if (reindexConfirm === 'all') {
      reindexAllMutation.mutate(requestTargetIndex);
      return;
    }
    reindexTypeMutation.mutate({ docType: reindexConfirm, target: requestTargetIndex });
  };

  const isReindexing = reindexAllMutation.isPending || reindexTypeMutation.isPending;
  const reindexTargetName = requestTargetIndex ?? defaultIndex;

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border bg-card p-5'>
          <div className='text-sm text-muted-foreground'>默认索引</div>
          <div className='mt-2 font-mono text-base font-semibold'>{defaultIndex}</div>
        </div>
        <div className='rounded-lg border bg-card p-5'>
          <div className='text-sm text-muted-foreground'>索引数量</div>
          <div className='mt-2 text-2xl font-semibold'>{indices.length}</div>
        </div>
        <div className='rounded-lg border bg-card p-5'>
          <div className='text-sm text-muted-foreground'>索引文档</div>
          <div className='mt-2 text-2xl font-semibold'>{formatNumber(totalDocuments)}</div>
        </div>
      </div>

      {error instanceof Error && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
          {error.message}
        </div>
      )}

      <div className='rounded-lg border bg-card p-6'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h3 className='text-lg font-semibold'>索引管理</h3>
            <div className='mt-1 flex flex-wrap gap-2'>
              {docTypes.map((docType) => (
                <Badge key={docType} variant='secondary'>
                  {docTypeLabel(docType)}
                </Badge>
              ))}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icons.refresh className='mr-2 h-4 w-4' />
              )}
              刷新
            </Button>
            <Button size='sm' onClick={() => setCreateOpen(true)}>
              <Icons.add className='mr-2 h-4 w-4' />
              创建索引
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-8 text-muted-foreground'>
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            加载中...
          </div>
        ) : indices.length === 0 ? (
          <p className='py-8 text-center text-muted-foreground'>暂无索引</p>
        ) : (
          <div className='divide-y rounded-md border'>
            {indices.map((item) => (
              <div
                key={item.name}
                className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'
              >
                <div className='min-w-0 space-y-1'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Icons.search className='h-4 w-4 shrink-0 text-muted-foreground' />
                    <span className='break-all font-mono text-sm'>{item.name}</span>
                    {item.defaultIndex && <Badge>默认</Badge>}
                  </div>
                  <div className='pl-7 text-xs text-muted-foreground'>
                    {formatNumber(item.documentCount)} 个文档
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={putMappingMutation.isPending}
                    onClick={() => putMappingMutation.mutate(item.name)}
                    title='更新 Mapping'
                  >
                    {putMappingMutation.isPending &&
                    putMappingMutation.variables === item.name ? (
                      <Icons.spinner className='h-4 w-4 animate-spin' />
                    ) : (
                      <Icons.refresh className='h-4 w-4 text-muted-foreground' />
                    )}
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={item.defaultIndex}
                    onClick={() => setDeleteTarget(item.name)}
                    title={item.defaultIndex ? '默认索引不可删除' : '删除索引'}
                  >
                    <Icons.trash className='h-4 w-4 text-destructive' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='rounded-lg border bg-card p-6'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <h3 className='text-lg font-semibold'>数据重建</h3>
          <Select value={targetIndex} onValueChange={setTargetIndex}>
            <SelectTrigger className='w-[260px]'>
              <SelectValue placeholder='选择目标索引' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='default'>默认索引（{defaultIndex}）</SelectItem>
              {indices
                .filter((item) => !item.defaultIndex)
                .map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-wrap gap-3'>
          <Button
            variant='outline'
            onClick={() => setReindexConfirm('all')}
            disabled={isReindexing}
          >
            {reindexAllMutation.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            重建全部类型
          </Button>
          {docTypes.map((docType) => (
            <Button
              key={docType}
              variant='outline'
              onClick={() => setReindexConfirm(docType)}
              disabled={isReindexing}
            >
              {reindexTypeMutation.isPending &&
                reindexTypeMutation.variables?.docType === docType && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
              重建{docTypeLabel(docType)}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建索引</DialogTitle>
            <DialogDescription>
              留空将创建默认索引 {defaultIndex}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newIndexName}
            onChange={(event) => setNewIndexName(event.target.value)}
            placeholder={defaultIndex}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => createMutation.mutate(newIndexName.trim() || undefined)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
        title='删除索引'
        description={`确定删除索引 "${deleteTarget}" 吗？此操作不可恢复。`}
      />

      <AlertModal
        isOpen={reindexConfirm !== null}
        onClose={() => setReindexConfirm(null)}
        onConfirm={handleReindexConfirm}
        loading={isReindexing}
        title='确认重建'
        description={
          reindexConfirm === 'all'
            ? `确定重建全部类型到 "${reindexTargetName}" 吗？`
            : `确定重建${docTypeLabel(reindexConfirm ?? '')}到 "${reindexTargetName}" 吗？`
        }
      />
    </div>
  );
}
