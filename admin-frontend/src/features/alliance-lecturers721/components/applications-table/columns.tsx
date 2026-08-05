'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { allianceLecturer721Keys } from '../../api/queries';
import {
  approveAllianceLecturer721Application,
  rejectAllianceLecturer721Application
} from '../../api/service';
import {
  ALLIANCE_LECTURER721_STATUS_MAP,
  ALLIANCE_LECTURER721_STATUS_OPTIONS,
  type AdminAllianceLecturer721Application
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
  application: AdminAllianceLecturer721Application;
}) {
  const pending = application.status === 1;
  return (
    <InlineAuditActions
      showApprove={pending}
      showReject={pending}
      subjectLabel={application.lecturerName}
      approveDescription={`确定要通过 ${application.lecturerName} 的721讲师合作申请吗？`}
      rejectDescription='请填写驳回原因，申请人将收到通知。'
      onApprove={() => approveAllianceLecturer721Application(application.id)}
      onReject={(reason) =>
        rejectAllianceLecturer721Application(application.id, reason)
      }
      invalidateKey={allianceLecturer721Keys.all}
      extra={<ApplicationDetailDialog applicationId={application.id} />}
    />
  );
}

export const columns: ColumnDef<AdminAllianceLecturer721Application>[] = [
  {
    accessorKey: 'id',
    header: '申请 ID',
    enableSorting: false
  },
  {
    accessorKey: 'applicationCode',
    header: '申请编号',
    enableSorting: false
  },
  {
    accessorKey: 'lecturerName',
    header: '讲师姓名',
    enableSorting: false
  },
  {
    accessorKey: 'phone',
    header: '手机号',
    enableSorting: false
  },
  {
    accessorKey: 'coopYears',
    header: '合作年限',
    enableSorting: false,
    cell: ({ cell }) => `${cell.getValue<number>()}年`
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const status =
        cell.getValue<AdminAllianceLecturer721Application['status']>();
      return (
        <Badge variant={statusVariant(status)}>
          {ALLIANCE_LECTURER721_STATUS_MAP[status]}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ALLIANCE_LECTURER721_STATUS_OPTIONS
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
