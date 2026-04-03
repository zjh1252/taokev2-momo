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
import type { AdminCourse } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approveCourse,
  rejectCourse,
  unpublishCourse,
  toggleFeatured
} from '../../api/service';
import { courseKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminCourse;
}

export function CellAction({ data }: CellActionProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const isPending = data.status === 1;
  const isPublished = data.status === 2;

  const approveMutation = useMutation({
    mutationFn: () => approveCourse(data.id),
    onSuccess: () => {
      toast.success('审核通过');
      setApproveOpen(false);
      void queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectCourse(data.id, reason),
    onSuccess: () => {
      toast.success('已驳回');
      setRejectOpen(false);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishCourse(data.id),
    onSuccess: () => {
      toast.success('已下架');
      setUnpublishOpen(false);
      void queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const featureMutation = useMutation({
    mutationFn: () => toggleFeatured(data.id),
    onSuccess: () => {
      toast.success(data.isFeatured === 1 ? '已取消主打' : '已设为主打');
      void queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  return (
    <>
      {/* 审核通过确认 */}
      <AlertModal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
        title='确认通过'
        description={`确定要通过课程「${data.title}」的审核吗？通过后课程将立即上架。`}
      />

      {/* 下架确认 */}
      <AlertModal
        isOpen={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        onConfirm={() => unpublishMutation.mutate()}
        loading={unpublishMutation.isPending}
        title='确认下架'
        description={`确定要下架课程「${data.title}」吗？`}
      />

      {/* 驳回弹窗 */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>驳回课程</DialogTitle>
            <DialogDescription>
              请填写驳回原因，发布者将收到通知。
            </DialogDescription>
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

          {/* 待审核：通过 / 驳回 */}
          {isPending && (
            <>
              <DropdownMenuItem onClick={() => setApproveOpen(true)}>
                <Icons.check className='mr-2 h-4 w-4' />
                通过
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRejectOpen(true)}>
                <Icons.close className='mr-2 h-4 w-4' />
                驳回
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* 已上架：下架 */}
          {isPublished && (
            <>
              <DropdownMenuItem onClick={() => setUnpublishOpen(true)}>
                <Icons.eyeOff className='mr-2 h-4 w-4' />
                下架
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* 主打切换（任何状态都可以） */}
          <DropdownMenuItem onClick={() => featureMutation.mutate()}>
            <Icons.star className='mr-2 h-4 w-4' />
            {data.isFeatured === 1 ? '取消主打' : '设为主打'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
