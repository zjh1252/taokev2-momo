'use client';

import { Badge } from '@/components/ui/badge';
import type { AdminApplicationDetail, AdminApplicationField } from '@/features/trainers/api/types';
import { APPLICATION_STATUS_MAP } from '@/features/trainers/api/types';
import { Icons } from '@/components/icons';

function statusVariant(status: number) {
  switch (status) {
    case 1:
      return 'default';
    case 2:
      return 'secondary';
    case 3:
      return 'destructive';
    default:
      return 'outline';
  }
}

interface ApplicationDetailViewProps {
  detail: AdminApplicationDetail;
}

/**
 * 通用角色申请详情展示组件 — 各角色后台申请列表「查看详情」共用。
 * 资料重审时高亮标记本批次变更的字段。
 *
 * @author Fangxinxin
 * @date 2026-06-25 18:00
 */
export function ApplicationDetailView({ detail }: ApplicationDetailViewProps) {
  const isReapplying = detail.reapplying === true;
  const isPending = detail.status === 2;
  const hasChangedFields = detail.fields?.some((f) => f.changed === true);

  return (
    <div className='space-y-6'>
      {/* 提示横幅 */}
      {(isReapplying || isPending) && (
        <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
          {isReapplying ? (
            <>
              <span className='font-medium'>资料重审</span>
              <span className='ml-2 text-amber-800'>
                用户已修改资料并重新提交，
                {hasChangedFields ? (
                  <span className='font-medium'>以下黄色高亮字段为本次修改内容</span>
                ) : (
                  '以下为最新申请内容'
                )}
                ，请核对后审核。原身份在审核期间仍可用。
              </span>
            </>
          ) : (
            <>
              <span className='font-medium'>待审核入驻</span>
              <span className='ml-2 text-amber-800'>
                以下为用户提交的入驻资料，请核对后通过或驳回。
              </span>
            </>
          )}
        </div>
      )}

      {/* 基本信息 */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Info label='申请ID' value={detail.id} />
        <Info label='用户ID' value={detail.userId} />
        <Info label='手机号' value={detail.phone || '-'} />
        <Info label='昵称' value={detail.nickname || '-'} />
        {detail.applicantName ? (
          <Info label='申请人' value={detail.applicantName} />
        ) : null}
        <Info
          label='角色'
          value={`${detail.roleName || detail.role} (${detail.role})`}
        />
        <Info
          label='状态'
          value={
            isReapplying ? (
              <Badge variant='secondary'>重提申请</Badge>
            ) : (
              <Badge variant={statusVariant(detail.status)}>
                {APPLICATION_STATUS_MAP[detail.status] ?? '未知'}
              </Badge>
            )
          }
        />
        {detail.rejectReason ? (
          <Info label='驳回原因' value={detail.rejectReason} />
        ) : null}
        <Info
          label='申请时间'
          value={
            detail.createdAt
              ? new Date(detail.createdAt).toLocaleString('zh-CN')
              : '-'
          }
        />
        {detail.approvedAt ? (
          <Info
            label='通过时间'
            value={new Date(detail.approvedAt).toLocaleString('zh-CN')}
          />
        ) : null}
      </div>

      {/* 表单字段详情 — 网格排列 */}
      <div>
        <h3 className='mb-3 text-sm font-medium'>申请资料</h3>
        <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {detail.fields?.map((f) => (
            <FieldCard key={f.fieldName} field={f} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldCard({ field }: { field: AdminApplicationField }) {
  const changed = field.changed === true;
  return (
    <div
      className={`rounded-lg border p-3 ${
        changed ? 'border-amber-300 bg-amber-50' : ''
      }`}
    >
      <div className='flex items-center gap-2 mb-1'>
        <span className='text-muted-foreground text-xs'>{field.fieldLabel}</span>
        {changed && (
          <Badge variant='secondary' className='text-[10px] px-1 py-0'>
            已修改
          </Badge>
        )}
      </div>
      <div className={`text-sm ${changed ? 'font-medium text-amber-900' : ''}`}>
        {field.value || <span className='text-muted-foreground italic'>未填写</span>}
      </div>
    </div>
  );
}

function Info({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='rounded-lg border p-3'>
      <div className='text-muted-foreground mb-1 text-xs'>{label}</div>
      <div className='text-sm'>{value}</div>
    </div>
  );
}
