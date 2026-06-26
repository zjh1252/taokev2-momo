'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminTrainingReview } from '../../api/types';
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
  const isPending = data.status === 0;
  const isApproved = data.status === 1;
  const canApprove =
    isPending || data.status === -1 || data.status === 2;

  const preview =
    data.commentText?.length > 40
      ? `${data.commentText.slice(0, 40)}…`
      : data.commentText || '该评价';

  return (
    <InlineAuditActions
      showApprove={canApprove}
      showReject={isPending}
      showHide={isApproved}
      subjectLabel={preview}
      approveTitle='确认通过'
      approveDescription={`确定要通过「${preview}」的审核吗？`}
      rejectTitle='驳回评价'
      rejectDescription='请填写驳回原因，用户将收到站内信通知。'
      hideTitle='隐藏评价'
      hideDescription='隐藏后前台不再展示；若当前为已通过状态，将同步减少被评对象累计评价数。确定隐藏吗？'
      onApprove={() => approveTrainingReview(data.id)}
      onReject={(reason) => rejectTrainingReview(data.id, reason)}
      onHide={() => hideTrainingReview(data.id)}
      invalidateKey={trainingReviewKeys.all}
      idleLabel={!canApprove && !isApproved ? '无可用操作' : undefined}
    />
  );
}
