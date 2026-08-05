'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ROLE_CERT_STATUS_MAP,
  ROLE_CERT_STATUS_OPTIONS,
  type AdminBuyerRealNameCert
} from '../../api/types';
import { CertFileLink } from '@/features/trainer-certifications/components/cert-file-link';
import { AuditCellAction } from '@/features/trainer-certifications/components/audit-cell-action';
import { approveBuyerRealName, rejectBuyerRealName } from '../../api/service';
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

function formatDate(val: string | null | undefined) {
  if (!val) return '-';
  return new Date(val).toLocaleString('zh-CN');
}

export const columns: ColumnDef<AdminBuyerRealNameCert>[] = [
  { accessorKey: 'buyerId', header: '采购方ID' },
  {
    id: 'user',
    header: '企业/联系人',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.companyName || '-'}</span>
        <span className='text-muted-foreground text-xs'>
          {row.original.realName || row.original.nickname || '-'}
          {row.original.phone ? ` · ${row.original.phone}` : ''}
        </span>
      </div>
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
      return <Badge variant={statusVariant(v)}>{ROLE_CERT_STATUS_MAP[v] ?? '-'}</Badge>;
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: ROLE_CERT_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'submittedAt',
    header: '提交时间',
    cell: ({ cell }) => formatDate(cell.getValue<string>())
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <AuditCellAction
        status={row.original.status}
        subjectLabel={row.original.companyName || row.original.realName || `采购方#${row.original.buyerId}`}
        onApprove={() => approveBuyerRealName(row.original.buyerId)}
        onReject={(reason) => rejectBuyerRealName(row.original.buyerId, reason)}
        invalidateKey={buyerCertKeys.all}
      />
    )
  }
];
