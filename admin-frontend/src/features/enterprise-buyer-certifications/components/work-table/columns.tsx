'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ROLE_CERT_STATUS_MAP,
  ROLE_CERT_STATUS_OPTIONS,
  type AdminBuyerWorkCert
} from '../../api/types';
import { CertFileLink } from '@/features/trainer-certifications/components/cert-file-link';
import { AuditCellAction } from '@/features/trainer-certifications/components/audit-cell-action';
import { approveBuyerWork, rejectBuyerWork } from '../../api/service';
import { buyerCertKeys } from '../../api/queries';

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

export const columns: ColumnDef<AdminBuyerWorkCert>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    id: 'user',
    header: '采购方',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.companyName || '-'}</span>
        <span className='text-muted-foreground text-xs'>
          {row.original.contactName || row.original.nickname || '-'}
          {row.original.phone ? ` · ${row.original.phone}` : ''}
        </span>
      </div>
    )
  },
  {
    accessorKey: 'workCompanyName',
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
    id: 'actions',
    cell: ({ row }) => (
      <AuditCellAction
        status={row.original.status}
        subjectLabel={row.original.workCompanyName || `记录#${row.original.id}`}
        onApprove={() => approveBuyerWork(row.original.id)}
        onReject={(reason) => rejectBuyerWork(row.original.id, reason)}
        invalidateKey={buyerCertKeys.all}
      />
    )
  }
];
