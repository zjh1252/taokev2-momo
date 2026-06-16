'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserBusinessRoles } from '../api/service';
import { assignBusinessRolesMutation } from '../api/mutations';
import { getRoles } from '@/features/roles/api/service';
import type { User } from '../api/types';

interface AssignRolesDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 授权平台角色弹窗 — 仅展示平台管理角色，业务角色由用户在前台申请。
 *
 * @author Fangxinxin
 * @date 2026-04-01 22:30
 */
export function AssignRolesDialog({ user, open, onOpenChange }: AssignRolesDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const platformRolesQuery = useQuery({
    queryKey: ['roles', 'platform'],
    queryFn: () => getRoles('PLATFORM'),
    enabled: open
  });

  const userRolesQuery = useQuery({
    queryKey: ['users', user?.id, 'roles'],
    queryFn: () => getUserBusinessRoles(user!.id),
    enabled: open && !!user
  });

  useEffect(() => {
    if (userRolesQuery.data?.data) {
      setSelected(new Set(userRolesQuery.data.data.map((r) => r.roleCode)));
    }
  }, [userRolesQuery.data]);

  const mutation = useMutation({
    ...assignBusinessRolesMutation,
    onSuccess: () => {
      toast.success('角色授权成功');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('角色授权失败');
    }
  });

  const allRoles = platformRolesQuery.data?.data ?? [];

  const handleToggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!user) return;
    mutation.mutate({
      id: user.id,
      payload: { roleCodes: Array.from(selected) }
    });
  };

  const isLoading = platformRolesQuery.isLoading || userRolesQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>授权平台角色</DialogTitle>
          <DialogDescription>
            为用户 <span className="font-medium text-foreground">{user?.nickname || user?.phone}</span> 分配平台管理角色
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">加载中...</div>
          </div>
        ) : (
          <div className="grid gap-2 py-2">
            {allRoles.map((role) => (
              <label
                key={role.roleCode}
                className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.has(role.roleCode)}
                  onCheckedChange={() => handleToggle(role.roleCode)}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{role.roleName}</div>
                  {role.description && (
                    <div className="text-muted-foreground text-xs mt-0.5">{role.description}</div>
                  )}
                </div>
              </label>
            ))}
            {allRoles.length === 0 && (
              <div className="text-muted-foreground text-sm text-center py-4">
                暂无可分配的平台角色
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || isLoading}>
            {mutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
