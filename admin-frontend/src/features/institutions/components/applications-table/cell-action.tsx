'use client';

import Link from 'next/link';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { AdminInstitutionApplication } from '../../api/types';
import {
  approveInstitutionApplication,
  rejectInstitutionApplication
} from '../../api/service';
import { institutionKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminInstitutionApplication;
}

export function CellAction({ data }: CellActionProps) {
  const isPending = data.status === 2 || data.reapplying === true;
  const label = data.orgName || data.nickname || '该用户';

  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={label}
      approveTitle='确认通过'
      approveDescription={`确定要通过 ${label} 的机构入驻申请吗？`}
      rejectTitle='驳回申请'
      rejectDescription='请填写驳回原因，申请人将收到通知。'
      onApprove={() => approveInstitutionApplication(data.userId)}
      onReject={(reason) => rejectInstitutionApplication(data.userId, reason)}
      invalidateKey={institutionKeys.all}
      idleLabel={
        data.status === 1 ? '已通过' : data.status === 3 ? '已驳回' : undefined
      }
      extra={
        <Link href={`/dashboard/institutions/applications/${data.userId}`}>
          <Button size='sm' variant='outline'>
            <Icons.eye className='size-3.5 mr-1' />
            详情
          </Button>
        </Link>
      }
    />
  );
}
