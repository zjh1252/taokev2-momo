'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ROLE_CERT_STATUS_MAP,
  ROLE_CERT_STATUS_OPTIONS,
  type AdminAgentWorkCert
} from '../../api/types';
import { CertFileLink } from '@/features/trainer-certifications/components/cert-file-link';
import { AuditCellAction } from '@/features/trainer-certifications/components/audit-cell-action';
import { approveAgentWork, rejectAgentWork } from '../../api/service';
import { agentCertKeys } from '../../api/queries';

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

export const columns: ColumnDef<AdminAgentWorkCert>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    id: 'user',
    header: '经纪人',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.realName || row.original.nickname || '-'}
        </span>
        {row.original.phone && (
          <span className='text-muted-foreground text-xs'>{row.original.phone}</span>
        )}
      </div>
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
      return <Badge variant={statusVariant(v)}>{ROLE_CERT_STATUS_MAP[v] ?? '-'}</Badge>;
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ROLE_CERT_STATUS_OPTIONS
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
        onApprove={() => approveAgentWork(row.original.id)}
        onReject={(reason) => rejectAgentWork(row.original.id, reason)}
        invalidateKey={agentCertKeys.all}
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
