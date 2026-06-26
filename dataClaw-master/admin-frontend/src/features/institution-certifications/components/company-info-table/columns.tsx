'use client';

import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  INST_CERT_STATUS_MAP,
  INST_CERT_STATUS_OPTIONS,
  type AdminInstitutionCompanyInfo
} from '../../api/types';
import { CertFileLink } from '@/features/trainer-certifications/components/cert-file-link';
import { AuditCellAction } from '@/features/trainer-certifications/components/audit-cell-action';
import { approveInstitution, rejectInstitution } from '../../api/service';
import { institutionCertKeys } from '../../api/queries';

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

export const columns: ColumnDef<AdminInstitutionCompanyInfo>[] = [
  {
    accessorKey: 'institutionId',
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
    accessorKey: 'orgName',
    header: '机构名称',
    cell: ({ cell }) => cell.getValue<string>() || '-'
  },
  {
    id: 'logo',
    header: 'Logo',
    cell: ({ row }) => <CertFileLink url={row.original.logoUrl} alt='机构 Logo' />
  },
  {
    id: 'businessOverview',
    header: '基础属性',
    cell: ({ row }) => (
      <div className='flex flex-col text-xs leading-relaxed text-muted-foreground'>
        <span>性质：{row.original.companyNature || '-'}</span>
        <span>规模：{row.original.companySize || '-'}</span>
        <span>年营收：{row.original.annualRevenue || '-'}</span>
        <span>注册资本：{row.original.registeredCapital || '-'}</span>
      </div>
    )
  },
  {
    id: 'commission',
    header: '佣金/付款',
    cell: ({ row }) => (
      <div className='flex flex-col text-xs leading-relaxed text-muted-foreground'>
        <span>
          最高佣金：
          {row.original.maxCommissionRate != null
            ? `${row.original.maxCommissionRate}%`
            : '-'}
        </span>
        <span>
          付款方式：
          {row.original.paymentMethods && row.original.paymentMethods.length > 0
            ? row.original.paymentMethods.join('、')
            : '-'}
        </span>
        <span>版权课：{row.original.hasCopyrightCourse === 1 ? '有' : '无'}</span>
      </div>
    )
  },
  {
    id: 'license',
    header: '营业执照',
    cell: ({ row }) => (
      <div className='flex flex-col gap-1'>
        <CertFileLink url={row.original.licenseDocUrl} alt='营业执照' />
        {row.original.licenseNo && (
          <span className='text-xs text-muted-foreground'>{row.original.licenseNo}</span>
        )}
      </div>
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
        <Badge variant={statusVariant(v)}>{INST_CERT_STATUS_MAP[v] ?? '-'}</Badge>
      );
    },
    meta: {
      label: '状态',
      variant: 'select' as const,
      options: INST_CERT_STATUS_OPTIONS
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
        subjectLabel={row.original.orgName || '公司资料'}
        onApprove={() => approveInstitution(row.original.institutionId)}
        onReject={(reason) => rejectInstitution(row.original.institutionId, reason)}
        invalidateKey={institutionCertKeys.all}
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
