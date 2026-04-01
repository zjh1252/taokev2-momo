'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { permissionTreeQueryOptions } from '../api/queries';
import { deletePermissionMutation } from '../api/mutations';
import type { Permission } from '../api/types';
import { PermissionFormDialog } from './permission-form-dialog';

export function PermissionTable() {
  const { data: resp, isLoading } = useQuery(permissionTreeQueryOptions());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Permission | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [parentForCreate, setParentForCreate] = useState<number>(0);

  const delMutation = useMutation({
    ...deletePermissionMutation,
    onSuccess: () => {
      toast.success('删除成功');
      setDeleteTarget(null);
    },
    onError: () => toast.error('删除失败')
  });

  const tree = resp?.data ?? [];

  if (isLoading) {
    return <div className='text-muted-foreground py-8 text-center'>加载中...</div>;
  }

  return (
    <>
      <AlertModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget)}
        loading={delMutation.isPending}
      />
      <PermissionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultParentId={parentForCreate}
      />
      {editTarget && (
        <PermissionFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          permission={editTarget}
        />
      )}

      <div className='mb-4 flex justify-end'>
        <Button
          onClick={() => {
            setParentForCreate(0);
            setCreateOpen(true);
          }}
        >
          <Icons.add className='mr-2 h-4 w-4' />
          新增权限
        </Button>
      </div>

      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[200px]'>权限名称</TableHead>
              <TableHead>权限编码</TableHead>
              <TableHead>模块</TableHead>
              <TableHead>操作类型</TableHead>
              <TableHead className='w-[60px]'>排序</TableHead>
              <TableHead className='w-[100px]'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tree.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              tree.map((node) => (
                <PermissionRow
                  key={node.id}
                  node={node}
                  depth={0}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  onAddChild={(parentId) => {
                    setParentForCreate(parentId);
                    setCreateOpen(true);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PermissionRow({
  node,
  depth,
  onEdit,
  onDelete,
  onAddChild
}: {
  node: Permission;
  depth: number;
  onEdit: (p: Permission) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className='flex items-center' style={{ paddingLeft: depth * 24 }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className='mr-1 p-0.5'
              >
                <Icons.chevronRight
                  className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className='mr-1 inline-block w-5' />
            )}
            <span className='font-medium'>{node.permissionName}</span>
          </div>
        </TableCell>
        <TableCell>
          <code className='bg-muted rounded px-1.5 py-0.5 text-xs'>
            {node.permissionCode}
          </code>
        </TableCell>
        <TableCell>
          <Badge variant='outline'>{node.module}</Badge>
        </TableCell>
        <TableCell>{node.actionType}</TableCell>
        <TableCell>{node.sortOrder}</TableCell>
        <TableCell>
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => onAddChild(node.id)}
              title='新增子权限'
            >
              <Icons.add className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => onEdit(node)}
            >
              <Icons.edit className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => onDelete(node.id)}
            >
              <Icons.trash className='h-3.5 w-3.5' />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded &&
        hasChildren &&
        node.children!.map((child) => (
          <PermissionRow
            key={child.id}
            node={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </>
  );
}
