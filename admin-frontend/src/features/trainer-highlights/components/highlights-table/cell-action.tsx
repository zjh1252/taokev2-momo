'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminTrainerHighlight } from '../../api/types';
import {
  approveTrainerHighlight,
  rejectTrainerHighlight
} from '../../api/service';
import { trainerHighlightKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminTrainerHighlight;
}

export function CellAction({ data }: CellActionProps) {
  const isPending = data.status === 0;

  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={data.title || '该精彩瞬间'}
      approveDescription={`确定要通过「${data.title || '该精彩瞬间'}」的审核吗？`}
      rejectTitle='驳回精彩瞬间'
      rejectDescription='请填写驳回原因，提交者将收到通知。'
      onApprove={() => approveTrainerHighlight(data.id)}
      onReject={(reason) => rejectTrainerHighlight(data.id, reason)}
      invalidateKey={trainerHighlightKeys.all}
      idleLabel={
        data.status === 1 ? '已通过' : data.status === 2 ? '已驳回' : undefined
      }
    />
  );
}
