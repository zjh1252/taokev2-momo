'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ENT_AGENT_CERT_STATUS_MAP,
  ENT_AGENT_CERT_STATUS_OPTIONS,
  type AdminEnterpriseAgentCert
} from '../../api/types';
import { CertFileLink } from '@/features/trainer-certifications/components/cert-file-link';
import { AuditCellAction } from '@/features/trainer-certifications/components/audit-cell-action';
import { approveEnterpriseAgent, rejectEnterpriseAgent } from '../../api/service';
import { entAgentCertKeys } from '../../api/queries';

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

export const columns: ColumnDef<AdminEnterpriseAgentCert>[] = [
  {
    accessorKey: 'enterpriseAgentId',
    header: 'ID'
  },
  {
    id: 'user',
    header: '提交人',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.nickname || '-'}</span>
        {row.original.phone && (
          <span className='text-muted-foreground text-xs'>{row.original.phone}</span>
        )}
      </div>
    )
  },
  {
    accessorKey: 'companyName',
    header: '公司名称',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'logo',
    header: '公司 Logo',
    cell: ({ row }) => <CertFileLink url={row.original.certLogoUrl} alt='Logo' />
  },
  {
    id: 'license',
    header: '营业执照',
    cell: ({ row }) => (
      <CertFileLink url={row.original.qualificationDocUrl} alt='营业执照' />
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    enableColumnFilter: true,
    cell: ({ cell }) => {
      const v = cell.getValue<number>();
      return (
        <Badge variant={statusVariant(v)}>
          {ENT_AGENT_CERT_STATUS_MAP[v] ?? '-'}
        </Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ENT_AGENT_CERT_STATUS_OPTIONS
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
        subjectLabel={row.original.companyName || '资质认证'}
        onApprove={() => approveEnterpriseAgent(row.original.enterpriseAgentId)}
        onReject={(reason) =>
          rejectEnterpriseAgent(row.original.enterpriseAgentId, reason)
        }
        invalidateKey={entAgentCertKeys.all}
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
