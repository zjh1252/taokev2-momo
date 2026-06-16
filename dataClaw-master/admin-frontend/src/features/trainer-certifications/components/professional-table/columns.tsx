'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { CERT_STATUS_MAP, CERT_STATUS_OPTIONS, type AdminProfessionalCert } from '../../api/types';
import { CertFileGallery } from '../cert-file-link';
import { AuditCellAction } from '../audit-cell-action';
import { approveProfessional, rejectProfessional } from '../../api/service';

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

export const columns: ColumnDef<AdminProfessionalCert>[] = [
  {
    accessorKey: 'trainerId',
    header: '专家ID'
  },
  {
    id: 'user',
    header: '用户',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.realName || row.original.nickname || '-'}</span>
        {row.original.phone && (
          <span className='text-muted-foreground text-xs'>{row.original.phone}</span>
        )}
      </div>
    )
  },
  {
    id: 'files',
    header: '专业资质附件',
    cell: ({ row }) => <CertFileGallery files={row.original.files} />
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
        onApprove={() => approveProfessional(row.original.trainerId)}
        onReject={(reason) => rejectProfessional(row.original.trainerId, reason)}
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
