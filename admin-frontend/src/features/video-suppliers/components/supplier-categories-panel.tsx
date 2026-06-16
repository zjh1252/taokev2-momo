'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Icons } from '@/components/icons';
import { supplierCategoriesQueryOptions, videoSupplierKeys } from '../api/queries';
import type { SupplierCategoryNode } from '../api/types';
import {
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory
} from '../api/service';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

function flattenCategories(
  nodes: SupplierCategoryNode[],
  depth = 0
): { node: SupplierCategoryNode; depth: number }[] {
  const rows: { node: SupplierCategoryNode; depth: number }[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.children?.length) {
      rows.push(...flattenCategories(node.children, depth + 1));
    }
  }
  return rows;
}

interface Props {
  supplierId: number;
}

export function SupplierCategoriesPanel({ supplierId }: Props) {
  const queryClient = useQueryClient();
  const { data: resp } = useSuspenseQuery(
    supplierCategoriesQueryOptions(supplierId)
  );
  const tree = resp.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierCategoryNode | null>(null);
  const [parentId, setParentId] = useState(0);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: videoSupplierKeys.categories(supplierId)
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateSupplierCategory(supplierId, editing.id, { name, sortOrder });
      }
      return createSupplierCategory(supplierId, {
        parentId: parentId || undefined,
        name,
        sortOrder
      });
    },
    onSuccess: () => {
      toast.success(editing ? '更新成功' : '创建成功');
      setDialogOpen(false);
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) =>
      deleteSupplierCategory(supplierId, categoryId),
    onSuccess: () => {
      toast.success('删除成功');
      invalidate();
    },
    onError: () => toast.error('删除失败')
  });

  const openCreate = (pid = 0) => {
    setEditing(null);
    setParentId(pid);
    setName('');
    setSortOrder(0);
    setDialogOpen(true);
  };

  const openEdit = (node: SupplierCategoryNode) => {
    setEditing(node);
    setParentId(node.parentId);
    setName(node.name);
    setSortOrder(node.sortOrder);
    setDialogOpen(true);
  };

  const rows = flattenCategories(tree);

  return (
    <>
      <div className='mb-4 flex justify-end'>
        <Button size='sm' onClick={() => openCreate()}>
          <Icons.add className='mr-1 h-4 w-4' />
          新增分类
        </Button>
      </div>

      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>分类名称</TableHead>
              <TableHead>层级</TableHead>
              <TableHead>排序</TableHead>
              <TableHead className='text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(({ node, depth }) => (
                <TableRow key={node.id}>
                  <TableCell>
                    <span style={{ paddingLeft: depth * 16 }}>{node.name}</span>
                  </TableCell>
                  <TableCell>{node.level}</TableCell>
                  <TableCell>{node.sortOrder}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openCreate(node.id)}
                    >
                      子分类
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openEdit(node)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => deleteMutation.mutate(node.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className='h-24 text-center'>
                  暂无分类
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑分类' : '新增分类'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>分类名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label>排序</Label>
              <Input
                type='number'
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              disabled={!name.trim()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
