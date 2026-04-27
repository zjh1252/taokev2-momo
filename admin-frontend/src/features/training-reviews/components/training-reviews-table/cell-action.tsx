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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AdminTrainingReview } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approveTrainingReview,
  hideTrainingReview,
  rejectTrainingReview
} from '../../api/service';
import { trainingReviewKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminTrainingReview;
}

export function CellAction({ data }: CellActionProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const isPending = data.status === 0;
  const isApproved = data.status === 1;

  const approveMutation = useMutation({
    mutationFn: () => approveTrainingReview(data.id),
    onSuccess: () => {
      toast.success('审核通过');
      setApproveOpen(false);
      void queryClient.invalidateQueries({ queryKey: trainingReviewKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectTrainingReview(data.id, reason),
    onSuccess: () => {
      toast.success('已驳回');
      setRejectOpen(false);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: trainingReviewKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const hideMutation = useMutation({
    mutationFn: () => hideTrainingReview(data.id),
    onSuccess: () => {
      toast.success('已隐藏');
      setHideOpen(false);
      void queryClient.invalidateQueries({ queryKey: trainingReviewKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const preview =
    data.commentText?.length > 40
      ? `${data.commentText.slice(0, 40)}…`
      : data.commentText || '该评价';

  return (
    <>
      <AlertModal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
        title='确认通过'
        description={`确定要通过「${preview}」的审核吗？`}
      />

      <AlertModal
        isOpen={hideOpen}
        onClose={() => setHideOpen(false)}
        onConfirm={() => hideMutation.mutate()}
        loading={hideMutation.isPending}
        title='隐藏评价'
        description='隐藏后前台不再展示；若当前为已通过状态，将同步减少被评对象累计评价数（专家/机构）。确定隐藏吗？'
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>驳回评价</DialogTitle>
            <DialogDescription>请填写驳回原因。</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='请输入驳回原因...'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button
              variant='destructive'
              disabled={!reason.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? '提交中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          {(isPending || data.status === -1 || data.status === 2) && (
            <DropdownMenuItem onClick={() => setApproveOpen(true)}>
              <Icons.check className='mr-2 h-4 w-4' />
              通过
            </DropdownMenuItem>
          )}
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRejectOpen(true)}>
                <Icons.close className='mr-2 h-4 w-4' />
                驳回
              </DropdownMenuItem>
            </>
          )}
          {isApproved && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setHideOpen(true)}>
                <Icons.eyeOff className='mr-2 h-4 w-4' />
                隐藏
              </DropdownMenuItem>
            </>
          )}
          {!isPending && !isApproved && data.status !== -1 && data.status !== 2 && (
            <DropdownMenuItem disabled>
              <Icons.info className='mr-2 h-4 w-4' />
              无可用操作
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
