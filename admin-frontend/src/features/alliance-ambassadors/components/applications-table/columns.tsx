'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { allianceAmbassadorKeys } from '../../api/queries';
import {
  approveAllianceAmbassadorApplication,
  rejectAllianceAmbassadorApplication
} from '../../api/service';
import {
  ALLIANCE_AMBASSADOR_STATUS_MAP,
  ALLIANCE_AMBASSADOR_STATUS_OPTIONS,
  type AdminAllianceAmbassadorApplication
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
  application: AdminAllianceAmbassadorApplication;
}) {
  const pending = application.status === 1;
  return (
    <InlineAuditActions
      showApprove={pending}
      showReject={pending}
      subjectLabel={application.ambassadorCode}
      approveDescription={`确定要通过 ${application.ambassadorCode} 的推广大使申请吗？`}
      rejectDescription='请填写驳回原因，申请人将收到通知。'
      onApprove={() => approveAllianceAmbassadorApplication(application.id)}
      onReject={(reason) =>
        rejectAllianceAmbassadorApplication(application.id, reason)
      }
      invalidateKey={allianceAmbassadorKeys.all}
      extra={<ApplicationDetailDialog applicationId={application.id} />}
    />
  );
}

export const columns: ColumnDef<AdminAllianceAmbassadorApplication>[] = [
  {
    accessorKey: 'id',
    header: '申请 ID',
    enableSorting: false
  },
  {
    accessorKey: 'ambassadorCode',
    header: '大使编号',
    enableSorting: false
  },
  {
    accessorKey: 'userId',
    header: '用户 ID',
    enableSorting: false
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status =
        cell.getValue<AdminAllianceAmbassadorApplication['status']>();
      return (
        <Badge variant={statusVariant(status)}>
          {ALLIANCE_AMBASSADOR_STATUS_MAP[status]}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ALLIANCE_AMBASSADOR_STATUS_OPTIONS
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
