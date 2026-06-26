'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { permissionTreeQueryOptions } from '@/features/permissions/api/queries';
import type { Permission } from '@/features/permissions/api/types';
import { assignPermissionsMutation } from '../api/mutations';
import type { Role } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function AssignPermissionsDialog({ open, onOpenChange, role }: Props) {
  const { data: resp, isLoading } = useQuery(permissionTreeQueryOptions());
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelected(new Set(role.permissionIds));
  }, [role, open]);

  const mutation = useMutation({
    ...assignPermissionsMutation,
    onSuccess: () => {
      toast.success('权限分配成功');
      onOpenChange(false);
    },
    onError: () => toast.error('权限分配失败')
  });

  const togglePermission = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (node: Permission, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const walk = (n: Permission) => {
        if (checked) next.add(n.id);
        else next.delete(n.id);
        n.children?.forEach(walk);
      };
      walk(node);
      return next;
    });
  };

  const handleSave = () => {
    mutation.mutate({
      roleId: role.id,
      data: { permissionIds: Array.from(selected) }
    });
  };

  const tree = resp?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>
            分配权限 — {role.roleName}
          </DialogTitle>
          <DialogDescription>
            勾选该角色需要的权限，保存后立即生效
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='text-muted-foreground py-8 text-center'>加载权限树...</div>
        ) : (
          <ScrollArea className='h-[400px] pr-3'>
            <div className='space-y-1'>
              {tree.map((node) => (
                <PermissionNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selected}
                  onToggle={togglePermission}
                  onToggleAll={toggleAll}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} isLoading={mutation.isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionNode({
  node,
  depth,
  selected,
  onToggle,
  onToggleAll
}: {
  node: Permission;
  depth: number;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: (node: Permission, checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isChecked = selected.has(node.id);

  const allChildIds = (n: Permission): number[] => {
    const ids = [n.id];
    n.children?.forEach((c) => ids.push(...allChildIds(c)));
    return ids;
  };

  const allIds = allChildIds(node);
  const allChecked = allIds.every((id) => selected.has(id));
  const someChecked = !allChecked && allIds.some((id) => selected.has(id));

  return (
    <div>
      <div
        className='hover:bg-muted/50 flex items-center rounded py-1'
        style={{ paddingLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className='mr-1 p-0.5'>
            <Icons.chevronRight
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className='mr-1 inline-block w-4.5' />
        )}
        <Checkbox
          checked={hasChildren ? (allChecked ? true : someChecked ? 'indeterminate' : false) : isChecked}
          onCheckedChange={(checked) => {
            if (hasChildren) {
              onToggleAll(node, !!checked);
            } else {
              onToggle(node.id);
            }
          }}
          className='mr-2'
        />
        <span className='text-sm'>{node.permissionName}</span>
        <span className='text-muted-foreground ml-2 text-xs'>
          {node.permissionCode}
        </span>
      </div>
      {expanded &&
        hasChildren &&
        node.children!.map((child) => (
          <PermissionNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selected={selected}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
          />
        ))}
    </div>
  );
}
