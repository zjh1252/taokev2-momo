'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { AdminVideoComment } from '../../api/types';
import {
  approveVideoComment,
  rejectVideoComment,
  deleteVideoComment
} from '../../api/service';
import { videoCommentKeys } from '../../api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

interface CellActionProps {
  data: AdminVideoComment;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: videoCommentKeys.all });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveVideoComment(data.id),
    onSuccess: () => {
      toast.success('已通过');
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectVideoComment(data.id),
    onSuccess: () => {
      toast.success('已驳回');
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVideoComment(data.id),
    onSuccess: () => {
      toast.success('已删除');
      setDeleteOpen(false);
      invalidate();
    },
    onError: () => toast.error('删除失败')
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title='删除评论'
        description='确定要删除该评论吗？此操作不可恢复。'
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          {data.auditStatus !== 1 && (
            <DropdownMenuItem onClick={() => approveMutation.mutate()}>
              <Icons.check className='mr-2 h-4 w-4' />
              通过
            </DropdownMenuItem>
          )}
          {data.auditStatus !== 2 && (
            <DropdownMenuItem onClick={() => rejectMutation.mutate()}>
              <Icons.close className='mr-2 h-4 w-4' />
              驳回
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
