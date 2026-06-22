'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { CERT_STATUS_MAP, CERT_STATUS_OPTIONS, type AdminRealNameCert } from '../../api/types';
import { CertFileLink } from '../cert-file-link';
import { CertUserLink } from '../cert-user-link';
import { AuditCellAction } from '../audit-cell-action';
import { approveRealName, rejectRealName } from '../../api/service';

function statusVariant(status: number) {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
      return 'destructive';
    default:
      return 'outline';
  }
}

export const columns: ColumnDef<AdminRealNameCert>[] = [
  {
    accessorKey: 'trainerId',
    header: '专家ID',
    enableSorting: false
  },
  {
    accessorKey: 'userId',
    header: '用户ID',
    enableSorting: false
  },
  {
    id: 'user',
    header: '用户名',
    cell: ({ row }) => (
      <CertUserLink
        userId={row.original.userId}
        label={row.original.nickname || row.original.realName || '-'}
        phone={row.original.phone}
      />
    )
  },
  {
    accessorKey: 'idCardNo',
    header: '身份证号',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'idCardFront',
    header: '人像面',
    cell: ({ row }) => <CertFileLink url={row.original.idCardFront} alt='身份证人像面' />
  },
  {
    id: 'idCardBack',
    header: '国徽面',
    cell: ({ row }) => <CertFileLink url={row.original.idCardBack} alt='身份证国徽面' />
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const v = cell.getValue<number>();
      return <Badge variant={statusVariant(v)}>{CERT_STATUS_MAP[v] ?? '-'}</Badge>;
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: CERT_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'rejectReason',
    header: '驳回原因',
    cell: ({ cell }) => {
      const v = cell.getValue<string>();
      return v ? <span className='text-destructive text-xs'>{v}</span> : '-';
    }
  },
  {
    accessorKey: 'submittedAt',
    header: '提交时间',
    cell: ({ cell }) => formatDate(cell.getValue<string>())
  },
  {
    accessorKey: 'auditedAt',
    header: '审核时间',
    cell: ({ cell }) => formatDate(cell.getValue<string>())
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <AuditCellAction
        status={row.original.status}
        subjectLabel={row.original.realName || row.original.nickname || `专家#${row.original.trainerId}`}
        onApprove={() => approveRealName(row.original.trainerId)}
        onReject={(reason) => rejectRealName(row.original.trainerId, reason)}
      />
    )
  }
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
