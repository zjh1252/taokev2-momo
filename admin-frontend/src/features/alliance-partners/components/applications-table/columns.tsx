'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  alliancePartnerKeys
} from '../../api/queries';
import {
  approveAlliancePartnerApplication,
  rejectAlliancePartnerApplication
} from '../../api/service';
import {
  ALLIANCE_PARTNER_STATUS_MAP,
  ALLIANCE_PARTNER_STATUS_OPTIONS,
  type AdminAlliancePartnerApplication
} from '../../api/types';
import { ApplicationDetailDialog } from './application-detail-dialog';

function statusVariant(status: number) {
  if (status === 2) return 'default';
  if (status === 3) return 'destructive';
  return 'secondary';
}

function ApplicationActions({
  application
}: {
  application: AdminAlliancePartnerApplication;
}) {
  const pending = application.status === 1;
  return (
    <InlineAuditActions
      showApprove={pending}
      showReject={pending}
      subjectLabel={application.companyName}
      approveDescription={`确定要通过 ${application.companyName} 的培训合伙人申请吗？`}
      rejectDescription='请填写驳回原因，申请人将收到通知。'
      onApprove={() => approveAlliancePartnerApplication(application.id)}
      onReject={(reason) =>
        rejectAlliancePartnerApplication(application.id, reason)
      }
      invalidateKey={alliancePartnerKeys.all}
      extra={<ApplicationDetailDialog applicationId={application.id} />}
    />
  );
}

export const columns: ColumnDef<AdminAlliancePartnerApplication>[] = [
  {
    accessorKey: 'id',
    header: '申请 ID',
    enableSorting: false
  },
  {
    accessorKey: 'partnerCode',
    header: '合伙人编号',
    enableSorting: false
  },
  {
    accessorKey: 'companyName',
    header: '公司名称',
    enableSorting: false
  },
  {
    accessorKey: 'contactName',
    header: '联系人',
    enableSorting: false
  },
  {
    accessorKey: 'companyPhone',
    header: '公司电话',
    enableSorting: false
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status = cell.getValue<AdminAlliancePartnerApplication['status']>();
      return (
        <Badge variant={statusVariant(status)}>
          {ALLIANCE_PARTNER_STATUS_MAP[status]}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ALLIANCE_PARTNER_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'createdAt',
    header: '提交时间',
    cell: ({ cell }) => {
      const value = cell.getValue<string>();
      return value ? new Date(value).toLocaleString('zh-CN') : '-';
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <ApplicationActions application={row.original} />
  }
];
