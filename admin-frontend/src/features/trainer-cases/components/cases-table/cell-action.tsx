'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminTrainerCase } from '../../api/types';
import { approveTrainerCase, rejectTrainerCase } from '../../api/service';
import { trainerCaseKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminTrainerCase;
}

export function CellAction({ data }: CellActionProps) {
  const isPending = data.status === 0;

  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={data.caseTitle}
      approveTitle='确认通过'
      approveDescription={`确定要通过案例「${data.caseTitle}」的审核吗？`}
      rejectTitle='驳回案例'
      rejectDescription='请填写驳回原因，提交者将收到通知。'
      onApprove={() => approveTrainerCase(data.id)}
      onReject={(reason) => rejectTrainerCase(data.id, reason)}
      invalidateKey={trainerCaseKeys.all}
      idleLabel={
        data.status === 1 ? '已通过' : data.status === 2 ? '已驳回' : undefined
      }
    />
  );
}
