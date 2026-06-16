'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FrontendLink } from '@/components/admin/frontend-link';
import { Icons } from '@/components/icons';
import {
  getAdminUserDetailUrl,
  getTrainerPublicUrl
} from '@/lib/frontend-links';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  TRAINER_STATUS_MAP,
  REAL_NAME_CERT_STATUS_MAP,
  type AdminTrainerDetail
} from '../api/types';
import { ROLE_LABEL_MAP } from '@/features/users/components/users-table/options';

function statusVariant(
  status: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

export function TrainerDetailView({ detail }: { detail: AdminTrainerDetail }) {
  const avatar = resolveAssetUrl(detail.avatar);

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <Badge variant={statusVariant(detail.status)}>
          {TRAINER_STATUS_MAP[detail.status] ?? '未知'}
        </Badge>
        {detail.isRecommended === 1 ? <Badge>推荐</Badge> : null}
        <FrontendLink href={getTrainerPublicUrl(detail.id)} className='text-sm'>
          查看前台页
        </FrontendLink>
      </div>

      <div className='flex gap-6'>
        {avatar ? (
          <div className='relative h-24 w-24 shrink-0 overflow-hidden rounded-full'>
            <Image
              src={avatar}
              alt={detail.name || ''}
              fill
              className='object-cover'
            />
          </div>
        ) : (
          <div className='flex h-24 w-24 items-center justify-center rounded-full bg-muted'>
            <Icons.user className='h-8 w-8 text-muted-foreground' />
          </div>
        )}
        <div className='space-y-1'>
          <h2 className='text-xl font-semibold'>{detail.name || '未命名'}</h2>
          {detail.title ? (
            <p className='text-muted-foreground text-sm'>{detail.title}</p>
          ) : null}
          {detail.trainerCode ? (
            <p className='text-muted-foreground text-xs'>
              编号：{detail.trainerCode}
            </p>
          ) : null}
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Info label='专家 ID' value={detail.id} />
        <Info
          label='关联用户'
          value={
            <Link
              href={getAdminUserDetailUrl(detail.userId)}
              className='text-primary hover:underline'
            >
              {detail.nickname || `用户 #${detail.userId}`}
            </Link>
          }
        />
        <Info label='联系电话' value={detail.phone || '-'} />
        <Info label='邮箱' value={detail.email || '-'} />
        <Info label='授课名' value={detail.teachingName || '-'} />
        <Info label='评分' value={detail.score > 0 ? detail.score : '-'} />
        <Info label='曝光量' value={detail.viewCount?.toLocaleString() ?? '0'} />
        <Info
          label='实名认证'
          value={
            detail.realNameCertStatus != null
              ? REAL_NAME_CERT_STATUS_MAP[detail.realNameCertStatus] ??
                detail.realNameCertStatus
              : '未提交'
          }
        />
        <Info
          label='专业认证'
          value={
            detail.professionalCertStatus != null
              ? REAL_NAME_CERT_STATUS_MAP[detail.professionalCertStatus] ??
                detail.professionalCertStatus
              : '-'
          }
        />
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='课程' value={detail.courseCount ?? 0} />
        <StatCard label='案例' value={detail.caseCount ?? 0} />
        <StatCard label='视频' value={detail.videoCount ?? 0} />
        <StatCard label='著作' value={detail.bookCount ?? 0} />
      </div>

      {detail.roles?.length ? (
        <div className='rounded-lg border p-4'>
          <h3 className='mb-2 text-sm font-medium'>业务角色</h3>
          <div className='flex flex-wrap gap-2'>
            {detail.roles.map((r) => (
              <Badge key={r.role} variant='outline'>
                {ROLE_LABEL_MAP[r.role] || r.role}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {detail.intro ? (
        <div>
          <h3 className='mb-2 font-medium'>个人简介</h3>
          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
            {detail.intro}
          </p>
        </div>
      ) : null}

      {detail.expertiseTags ? (
        <div>
          <h3 className='mb-2 font-medium'>擅长领域</h3>
          <p className='text-sm'>{detail.expertiseTags}</p>
        </div>
      ) : null}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-lg border p-4 text-center'>
      <div className='text-2xl font-semibold'>{value}</div>
      <div className='text-muted-foreground text-xs'>{label}</div>
    </div>
  );
}
