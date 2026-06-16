'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import type { AdminTrainerApplication } from '../../api/types';
import { approveApplication, rejectApplication } from '../../api/service';
import { trainerKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminTrainerApplication;
}

export function CellAction({ data }: CellActionProps) {
  const isPending = data.status === 2 || data.reapplying === true;
  const label = data.trainerName || data.nickname || '该用户';

  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={label}
      approveTitle='确认通过'
      approveDescription={`确定要通过 ${label} 的专家入驻申请吗？`}
      rejectTitle='驳回申请'
      rejectDescription='请填写驳回原因，申请人将收到通知。'
      onApprove={() => approveApplication(data.userId)}
      onReject={(reason) => rejectApplication(data.userId, reason)}
      invalidateKey={trainerKeys.all}
      idleLabel={
        data.status === 1 ? '已通过' : data.status === 3 ? '已驳回' : undefined
      }
    />
  );
}
