'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { CERT_STATUS_MAP, CERT_STATUS_OPTIONS, type AdminWorkCert } from '../../api/types';
import { CertFileLink } from '../cert-file-link';
import { CertUserLink } from '../cert-user-link';
import { AuditCellAction } from '../audit-cell-action';
import { approveWork, rejectWork } from '../../api/service';

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

export const columns: ColumnDef<AdminWorkCert>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    id: 'user',
    header: '用户名',
    cell: ({ row }) => (
      <CertUserLink
        userId={row.original.userId}
        label={row.original.nickname || '-'}
        phone={row.original.phone}
      />
    )
  },
  {
    accessorKey: 'companyName',
    header: '单位名称',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    accessorKey: 'position',
    header: '担任职务',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'period',
    header: '工作时间',
    cell: ({ row }) => (
      <span className='text-xs'>
        {row.original.startDate || '-'} ~ {row.original.endDate || '至今'}
      </span>
    )
  },
  {
    id: 'proofFile',
    header: '证明文件',
    cell: ({ row }) => <CertFileLink url={row.original.proofFile} alt='工作证明' />
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
    accessorKey: 'auditedAt',
    header: '审核时间',
    cell: ({ cell }) => formatDate(cell.getValue<string>())
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <AuditCellAction
        status={row.original.status}
        subjectLabel={`${row.original.companyName || ''} - ${row.original.position || '工作记录'}`.trim()}
        onApprove={() => approveWork(row.original.id)}
        onReject={(reason) => rejectWork(row.original.id, reason)}
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
