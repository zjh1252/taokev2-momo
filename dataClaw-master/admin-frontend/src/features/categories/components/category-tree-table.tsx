'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { categoryTreeQueryOptions } from '../api/queries';
import { deleteCategoryMutation, updateCategoryMutation } from '../api/mutations';
import type { CategoryNode } from '../api/types';
import { CATEGORY_TYPE_LABELS } from '../api/types';
import { CategoryFormDialog } from './category-form-dialog';

interface Props {
  categoryType: string;
}

/**
 * 分类树形表格 — 按 type 展示分类层级，支持展开收起、可见性开关、增删改。
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
export function CategoryTreeTable({ categoryType }: Props) {
  const { data: resp, isLoading } = useQuery(categoryTreeQueryOptions(categoryType));
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<CategoryNode | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [parentForCreate, setParentForCreate] = useState(0);

  const delMutation = useMutation({
    ...deleteCategoryMutation,
    onSuccess: () => {
      toast.success('删除成功');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || '删除失败')
  });

  const toggleVisibility = useMutation({
    ...updateCategoryMutation,
    onSuccess: () => toast.success('已更新可见性'),
    onError: (err) => toast.error(err.message || '更新失败')
  });

  const tree = resp?.data ?? [];
  const typeLabel = CATEGORY_TYPE_LABELS[categoryType] ?? categoryType;

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center">加载中...</div>;
  }

  return (
    <>
      <AlertModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget)}
        loading={delMutation.isPending}
      />
      <CategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categoryType={categoryType}
        defaultParentId={parentForCreate}
      />
      {editTarget && (
        <CategoryFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          categoryType={categoryType}
          category={editTarget}
        />
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{typeLabel}</h2>
        <Button
          onClick={() => {
            setParentForCreate(0);
            setCreateOpen(true);
          }}
        >
          <Icons.add className="mr-2 h-4 w-4" />
          新增分类
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">分类名称</TableHead>
              <TableHead className="w-[60px]">层级</TableHead>
              <TableHead className="w-[60px]">排序</TableHead>
              <TableHead className="w-[80px]">可见</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tree.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              tree.map((node) => (
                <CategoryRow
                  key={node.id}
                  node={node}
                  depth={0}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  onAddChild={(parentId) => {
                    setParentForCreate(parentId);
                    setCreateOpen(true);
                  }}
                  onToggleVisibility={(id, visible) => {
                    toggleVisibility.mutate({ id, data: { isVisible: visible ? 1 : 0 } });
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

function CategoryRow({
  node,
  depth,
  onEdit,
  onDelete,
  onAddChild,
  onToggleVisibility
}: {
  node: CategoryNode;
  depth: number;
  onEdit: (c: CategoryNode) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onToggleVisibility: (id: number, visible: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <TableRow className={node.isVisible === 0 ? 'opacity-50' : ''}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: depth * 24 }}>
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="mr-1 p-0.5">
                <Icons.chevronRight
                  className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="mr-1 inline-block w-5" />
            )}
            <span className="font-medium">{node.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">L{node.level}</Badge>
        </TableCell>
        <TableCell>{node.sortOrder}</TableCell>
        <TableCell>
          <Switch
            checked={node.isVisible === 1}
            onCheckedChange={(checked) => onToggleVisibility(node.id, checked)}
          />
        </TableCell>
        <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
          {node.description || '-'}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddChild(node.id)}
              title="新增子分类"
            >
              <Icons.add className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(node)}
              title="编辑"
            >
              <Icons.edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(node.id)}
              title="删除"
            >
              <Icons.trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded &&
        hasChildren &&
        node.children!.map((child) => (
          <CategoryRow
            key={child.id}
            node={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onToggleVisibility={onToggleVisibility}
          />
        ))}
    </>
  );
}
