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
import { rolesQueryOptions } from '../api/queries';
import { deleteRoleMutation } from '../api/mutations';
import type { Role } from '../api/types';
import { RoleFormDialog } from './role-form-dialog';
import { AssignPermissionsDialog } from './assign-permissions-dialog';

export function RoleTable() {
  const { data: resp, isLoading } = useQuery(rolesQueryOptions());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Role | null>(null);

  const delMutation = useMutation({
    ...deleteRoleMutation,
    onSuccess: () => {
      toast.success('删除成功');
      setDeleteTarget(null);
    },
    onError: () => toast.error('删除失败')
  });

  const roles = resp?.data ?? [];

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
      <RoleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <RoleFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          role={editTarget}
        />
      )}
      {assignTarget && (
        <AssignPermissionsDialog
          open={!!assignTarget}
          onOpenChange={(open) => !open && setAssignTarget(null)}
          role={assignTarget}
        />
      )}

      <div className='mb-4 flex justify-end'>
        <Button onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' />
          新增角色
        </Button>
      </div>

      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色编码</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className='w-[80px]'>类型</TableHead>
              <TableHead className='w-[80px]'>状态</TableHead>
              <TableHead className='w-[80px]'>权限数</TableHead>
              <TableHead className='w-[140px]'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center'>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <code className='bg-muted rounded px-1.5 py-0.5 text-xs'>
                      {role.roleCode}
                    </code>
                  </TableCell>
                  <TableCell className='font-medium'>{role.roleName}</TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {role.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystem ? 'default' : 'outline'}>
                      {role.isSystem ? '系统' : '自定义'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? 'default' : 'secondary'}>
                      {role.isActive ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell>{role.permissionIds.length}</TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => setAssignTarget(role)}
                        title='分配权限'
                      >
                        <Icons.permission className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => setEditTarget(role)}
                        title='编辑'
                      >
                        <Icons.edit className='h-3.5 w-3.5' />
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => setDeleteTarget(role.id)}
                          title='删除'
                        >
                          <Icons.trash className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
