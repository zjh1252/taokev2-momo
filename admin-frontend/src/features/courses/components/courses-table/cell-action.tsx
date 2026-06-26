'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminCourse } from '../../api/types';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approveCourse,
  batchUpdateExpireHide,
  rejectCourse,
  unpublishCourse,
  toggleFeatured
} from '../../api/service';
import { courseKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminCourse;
}

export function CellAction({ data }: CellActionProps) {
  const queryClient = useQueryClient();
  const [unpublishOpen, setUnpublishOpen] = useState(false);

  const isPending = data.status === 1;
  const isPublished = data.status === 2;

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishCourse(data.id),
    onSuccess: () => {
      toast.success('已下架');
      setUnpublishOpen(false);
    },
    onError: () => toast.error('操作失败')
  });

  const featureMutation = useMutation({
    mutationFn: () => toggleFeatured(data.id),
    onSuccess: () => {
      toast.success(data.isFeatured === 1 ? '已取消主打' : '已设为主打');
    },
    onError: () => toast.error('操作失败')
  });

  const expireHideMutation = useMutation({
    mutationFn: (next: 0 | 1) => batchUpdateExpireHide([data.id], next),
    onSuccess: (_, next) => {
      toast.success(next === 1 ? '已开启到期自动隐藏' : '已关闭到期自动隐藏');
    },
    onError: () => toast.error('操作失败'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    }
  });

  const isOfflineOpen = data.type === 'OPEN_OFFLINE';

  return (
    <>
      <AlertModal
        isOpen={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        onConfirm={() => unpublishMutation.mutate()}
        loading={unpublishMutation.isPending}
        title='确认下架'
        description={`确定要下架课程「${data.title}」吗？`}
      />

      <InlineAuditActions
        showApprove={isPending}
        showReject={isPending}
        subjectLabel={data.title}
        approveDescription={`确定要通过课程「${data.title}」的审核吗？通过后课程将立即上架。`}
        rejectTitle='驳回课程'
        rejectDescription='请填写驳回原因，发布者将收到通知。'
        onApprove={() => approveCourse(data.id)}
        onReject={(reason) => rejectCourse(data.id, reason)}
        invalidateKey={courseKeys.all}
        extra={
          <>
            {isPublished ? (
              <Button
                size='sm'
                variant='secondary'
                onClick={() => setUnpublishOpen(true)}
              >
                下架
              </Button>
            ) : null}
            <Button
              size='sm'
              variant='outline'
              onClick={() => featureMutation.mutate()}
              disabled={featureMutation.isPending}
            >
              {data.isFeatured === 1 ? '取消主打' : '设为主打'}
            </Button>
            {isOfflineOpen ? (
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  expireHideMutation.mutate(data.isExpireHide === 1 ? 0 : 1)
                }
                disabled={expireHideMutation.isPending}
              >
                {data.isExpireHide === 1 ? '关闭自动隐藏' : '开启自动隐藏'}
              </Button>
            ) : null}
          </>
        }
        idleLabel={
          !isPending && !isPublished
            ? data.status === 3
              ? '已驳回'
              : data.status === 4
                ? '已下架'
                : undefined
            : undefined
        }
      />
    </>
  );
}
