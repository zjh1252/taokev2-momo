'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { AlertModal } from '@/components/modal/alert-modal';
import { indicesQueryOptions, searchKeys } from '../api/queries';
import { createIndex, deleteIndex, reindexAll, reindexByType, putMapping } from '../api/service';

const DEFAULT_INDEX = 'taokev2app';

export function SearchManagement() {
  const queryClient = useQueryClient();
  const { data: indicesResp, isLoading } = useQuery(indicesQueryOptions());

  const indices = indicesResp?.data ?? [];

  // --------------- 创建索引 ---------------
  const [createOpen, setCreateOpen] = useState(false);
  const [newIndexName, setNewIndexName] = useState('');

  const createMutation = useMutation({
    mutationFn: (name?: string) => createIndex(name),
    onSuccess: (resp) => {
      if (resp.data) {
        toast.success('索引创建成功');
      } else {
        toast.info('索引已存在');
      }
      queryClient.invalidateQueries({ queryKey: searchKeys.indices() });
      setCreateOpen(false);
      setNewIndexName('');
    },
    onError: () => toast.error('索引创建失败')
  });

  // --------------- 删除索引 ---------------
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteIndex(name),
    onSuccess: () => {
      toast.success('索引删除成功');
      queryClient.invalidateQueries({ queryKey: searchKeys.indices() });
      setDeleteTarget(null);
    },
    onError: () => toast.error('索引删除失败')
  });

  // --------------- 更新 Mapping ---------------
  const putMappingMutation = useMutation({
    mutationFn: (name: string) => putMapping(name),
    onSuccess: (resp) => {
      if (resp.data) {
        toast.success('Mapping 更新成功');
      } else {
        toast.info('索引不存在，无需更新');
      }
    },
    onError: () => toast.error('Mapping 更新失败')
  });
  const [reindexConfirm, setReindexConfirm] = useState<string | null>(null);

  const reindexAllMutation = useMutation({
    mutationFn: () => reindexAll(),
    onSuccess: (resp) => {
      toast.success(resp.data?.message ?? '全量重建完成');
      setReindexConfirm(null);
    },
    onError: () => toast.error('全量重建失败')
  });

  const reindexTypeMutation = useMutation({
    mutationFn: (docType: string) => reindexByType(docType),
    onSuccess: (resp) => {
      toast.success(resp.data?.message ?? '重建完成');
      setReindexConfirm(null);
    },
    onError: () => toast.error('重建失败')
  });

  const handleReindexConfirm = () => {
    if (!reindexConfirm) return;
    if (reindexConfirm === 'all') {
      reindexAllMutation.mutate();
    } else {
      reindexTypeMutation.mutate(reindexConfirm);
    }
  };

  const isReindexing =
    reindexAllMutation.isPending || reindexTypeMutation.isPending;

  return (
    <div className='space-y-6'>
      {/* ==================== 索引管理 ==================== */}
      <div className='rounded-lg border bg-card p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>索引管理</h3>
          <Button size='sm' onClick={() => setCreateOpen(true)}>
            <Icons.add className='mr-2 h-4 w-4' />
            创建索引
          </Button>
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
            {indices.map((name) => (
              <div key={name} className='flex items-center justify-between px-4 py-3'>
                <div className='flex items-center gap-3'>
                  <Icons.search className='h-4 w-4 text-muted-foreground' />
                  <span className='font-mono text-sm'>{name}</span>
                  {name === DEFAULT_INDEX && (
                    <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                      默认
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={putMappingMutation.isPending}
                    onClick={() => putMappingMutation.mutate(name)}
                    title='更新 Mapping（加新字段后使用）'
                  >
                    {putMappingMutation.isPending &&
                    putMappingMutation.variables === name ? (
                      <Icons.spinner className='h-4 w-4 animate-spin' />
                    ) : (
                      <Icons.refresh className='h-4 w-4 text-muted-foreground' />
                    )}
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={name === DEFAULT_INDEX}
                    onClick={() => setDeleteTarget(name)}
                    title={name === DEFAULT_INDEX ? '默认索引不可删除' : '删除索引'}
                  >
                    <Icons.trash className='h-4 w-4 text-destructive' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== 数据重建 ==================== */}
      <div className='rounded-lg border bg-card p-6'>
        <h3 className='mb-4 text-lg font-semibold'>数据重建</h3>
        <p className='mb-4 text-sm text-muted-foreground'>
          将数据库中的数据全量同步到 ES 索引。数据量较大时可能需要一些时间。
        </p>
        <div className='flex flex-wrap gap-3'>
          <Button
            variant='outline'
            onClick={() => setReindexConfirm('all')}
            disabled={isReindexing}
          >
            {reindexAllMutation.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            全量重建（全部类型）
          </Button>
          <Button
            variant='outline'
            onClick={() => setReindexConfirm('course')}
            disabled={isReindexing}
          >
            {reindexTypeMutation.isPending &&
              reindexTypeMutation.variables === 'course' && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
            重建课程数据
          </Button>
          <Button
            variant='outline'
            onClick={() => setReindexConfirm('trainer')}
            disabled={isReindexing}
          >
            {reindexTypeMutation.isPending &&
              reindexTypeMutation.variables === 'trainer' && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
            重建专家数据
          </Button>
        </div>
      </div>

      {/* ==================== 创建索引对话框 ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建索引</DialogTitle>
            <DialogDescription>
              输入索引名称，留空则使用默认索引名 ({DEFAULT_INDEX})
            </DialogDescription>
          </DialogHeader>
          <input
            value={newIndexName}
            onChange={(e) => setNewIndexName(e.target.value)}
            placeholder={DEFAULT_INDEX}
            className='w-full rounded-md border px-3 py-2 text-sm'
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => createMutation.mutate(newIndexName || undefined)}
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

      {/* ==================== 删除确认 ==================== */}
      <AlertModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
        title='删除索引'
        description={`确定要删除索引 "${deleteTarget}" 吗？此操作不可恢复。`}
      />

      {/* ==================== 重建确认 ==================== */}
      <AlertModal
        isOpen={reindexConfirm !== null}
        onClose={() => setReindexConfirm(null)}
        onConfirm={handleReindexConfirm}
        loading={isReindexing}
        title='确认重建'
        description={
          reindexConfirm === 'all'
            ? '确定要全量重建所有文档类型吗？这可能需要一些时间。'
            : `确定要重建 ${reindexConfirm} 类型的文档吗？`
        }
      />
    </div>
  );
}
