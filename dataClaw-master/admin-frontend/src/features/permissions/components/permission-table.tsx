'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { permissionListQueryOptions } from '../api/queries';
import { deletePermissionMutation } from '../api/mutations';
import type { Permission } from '../api/types';
import { PermissionFormDialog } from './permission-form-dialog';

/** 按 module 字段分组，保留组内排序 */
function groupByModule(list: Permission[]) {
  const map = new Map<string, Permission[]>();
  for (const p of list) {
    const key = p.module || '未分类';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries());
}

export function PermissionTable() {
  const { data: resp, isLoading } = useQuery(permissionListQueryOptions());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Permission | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [parentForCreate, setParentForCreate] = useState<number>(0);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  const delMutation = useMutation({
    ...deletePermissionMutation,
    onSuccess: () => {
      toast.success('删除成功');
      setDeleteTarget(null);
    },
    onError: () => toast.error('删除失败')
  });

  const allPermissions = resp?.data ?? [];
  const moduleGroups = useMemo(() => groupByModule(allPermissions), [allPermissions]);

  const toggleModule = (module: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

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
              <TableHead>操作类型</TableHead>
              <TableHead className='w-[60px]'>排序</TableHead>
              <TableHead className='text-right w-[100px]'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moduleGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              moduleGroups.map(([module, permissions]) => {
                const isCollapsed = collapsedModules.has(module);
                return (
                  <ModuleGroup
                    key={module}
                    module={module}
                    permissions={permissions}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleModule(module)}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onAddChild={(parentId) => {
                      setParentForCreate(parentId);
                      setCreateOpen(true);
                    }}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ModuleGroup({
  module,
  permissions,
  isCollapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddChild
}: {
  module: string;
  permissions: Permission[];
  isCollapsed: boolean;
  onToggle: () => void;
  onEdit: (p: Permission) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  return (
    <>
      {/* 模块分组行 — 整行可点击折叠/展开 */}
      <TableRow
        className='bg-muted/50 hover:bg-muted cursor-pointer select-none'
        onClick={onToggle}
      >
        <TableCell colSpan={5}>
          <div className='flex items-center gap-2'>
            <Icons.chevronRight
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                !isCollapsed ? 'rotate-90' : ''
              }`}
            />
            <span className='font-semibold'>{module}</span>
            <span className='text-muted-foreground text-xs'>
              ({permissions.length} 项)
            </span>
          </div>
        </TableCell>
      </TableRow>

      {/* 模块下的权限行 */}
      {!isCollapsed &&
        permissions.map((perm) => (
          <TableRow key={perm.id}>
            <TableCell>
              <div className='flex items-center pl-6'>
                <span>{perm.permissionName}</span>
              </div>
            </TableCell>
            <TableCell>
              <code className='bg-muted rounded px-1.5 py-0.5 text-xs'>
                {perm.permissionCode}
              </code>
            </TableCell>
            <TableCell>{perm.actionType}</TableCell>
            <TableCell>{perm.sortOrder}</TableCell>
            <TableCell>
              <div className='flex justify-end gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => onAddChild(perm.id)}
                  title='新增子权限'
                >
                  <Icons.add className='h-3.5 w-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => onEdit(perm)}
                >
                  <Icons.edit className='h-3.5 w-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => onDelete(perm.id)}
                >
                  <Icons.trash className='h-3.5 w-3.5' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
