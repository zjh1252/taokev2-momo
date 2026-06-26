'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { supplierVideosQueryOptions, videoSupplierKeys } from '../api/queries';
import { updateSupplierVideoSort } from '../api/service';

interface Props {
  supplierId: number;
}

export function SupplierVideosPanel({ supplierId }: Props) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data: resp } = useSuspenseQuery(
    supplierVideosQueryOptions(supplierId, page)
  );

  const list = resp.data?.list ?? [];
  const total = resp.data?.total ?? 0;
  const pageCount = Math.ceil(total / 20) || 1;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortValue, setSortValue] = useState(0);

  const sortMutation = useMutation({
    mutationFn: ({ videoId, sortOrder }: { videoId: number; sortOrder: number }) =>
      updateSupplierVideoSort(supplierId, videoId, sortOrder),
    onSuccess: () => {
      toast.success('排序已更新');
      setEditingId(null);
      void queryClient.invalidateQueries({
        queryKey: videoSupplierKeys.videos(supplierId, page)
      });
    },
    onError: () => toast.error('更新失败')
  });

  return (
    <div className='space-y-4'>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>视频名称</TableHead>
              <TableHead>分类标签</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length ? (
              list.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>{item.title}</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {item.categoryNames?.length ? (
                        item.categoryNames.map((tag) => (
                          <Badge key={tag} variant='outline'>
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className='text-muted-foreground text-sm'>-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{item.statusLabel}</Badge>
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <div className='flex items-center gap-2'>
                        <Input
                          type='number'
                          className='h-8 w-20'
                          value={sortValue}
                          onChange={(e) => setSortValue(Number(e.target.value))}
                        />
                        <Button
                          size='sm'
                          onClick={() =>
                            sortMutation.mutate({
                              videoId: item.id,
                              sortOrder: sortValue
                            })
                          }
                        >
                          保存
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setEditingId(item.id);
                          setSortValue(item.sortOrder);
                        }}
                      >
                        {item.sortOrder}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  暂无视频
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className='text-muted-foreground text-sm'>
            {page} / {pageCount}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
