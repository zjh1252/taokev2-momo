'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminVideo } from '../../api/types';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approveVideo,
  rejectVideo,
  unpublishVideo,
  publishVideo
} from '../../api/service';
import { videoKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminVideo;
}

export function CellAction({ data }: CellActionProps) {
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const isPending = data.status === 1;
  const isPublished = data.status === 2;
  const isUnpublished = data.status === 4;

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishVideo(data.id),
    onSuccess: () => {
      toast.success('已下架');
      setUnpublishOpen(false);
    },
    onError: () => toast.error('操作失败')
  });

  const publishMutation = useMutation({
    mutationFn: () => publishVideo(data.id),
    onSuccess: () => {
      toast.success('已重新上架');
      setPublishOpen(false);
    },
    onError: () => toast.error('操作失败')
  });

  return (
    <>
      <AlertModal
        isOpen={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        onConfirm={() => unpublishMutation.mutate()}
        loading={unpublishMutation.isPending}
        title='确认下架'
        description={`确定要下架录播课「${data.title}」吗？`}
      />

      <AlertModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => publishMutation.mutate()}
        loading={publishMutation.isPending}
        title='确认上架'
        description={`确定要重新上架录播课「${data.title}」吗？`}
      />

      <InlineAuditActions
        showApprove={isPending}
        showReject={isPending}
        subjectLabel={data.title}
        approveDescription={`确定要通过录播课「${data.title}」的审核吗？通过后将立即上架。`}
        rejectTitle='驳回录播课'
        rejectDescription='请填写驳回原因，发布者将收到通知。'
        onApprove={() => approveVideo(data.id)}
        onReject={(reason) => rejectVideo(data.id, reason)}
        invalidateKey={videoKeys.all}
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
            {isUnpublished ? (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setPublishOpen(true)}
              >
                上架
              </Button>
            ) : null}
          </>
        }
        idleLabel={
          !isPending && !isPublished && !isUnpublished ? '—' : undefined
        }
      />
    </>
  );
}
