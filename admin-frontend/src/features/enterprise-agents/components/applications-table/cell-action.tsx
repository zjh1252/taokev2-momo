'use client';

import Link from 'next/link';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { AdminEnterpriseAgentApplication } from '../../api/types';
import { approveEAApplication, rejectEAApplication } from '../../api/service';
import { eaKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminEnterpriseAgentApplication;
}

export function CellAction({ data }: CellActionProps) {
  const isPending = data.status === 2 || data.reapplying === true;
  const label = data.companyName || data.nickname || '该用户';

  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={label}
      approveTitle='确认通过'
      approveDescription={`确定要通过 ${label} 的经纪公司入驻申请吗？`}
      rejectTitle='驳回申请'
      rejectDescription='请填写驳回原因，申请人将收到通知。'
      onApprove={() => approveEAApplication(data.userId)}
      onReject={(reason) => rejectEAApplication(data.userId, reason)}
      invalidateKey={eaKeys.all}
      idleLabel={
        data.status === 1 ? '已通过' : data.status === 3 ? '已驳回' : undefined
      }
      extra={
        <Link href={`/dashboard/enterprise-agents/applications/${data.userId}`}>
          <Button size='sm' variant='outline'>
            <Icons.eye className='size-3.5 mr-1' />
            详情
          </Button>
        </Link>
      }
    />
  );
}
