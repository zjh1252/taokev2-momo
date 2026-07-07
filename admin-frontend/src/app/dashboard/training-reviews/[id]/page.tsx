'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { getTrainingReviewDetail } from '@/features/training-reviews/api/service';
import {
  approveTrainingReview,
  hideTrainingReview,
  rejectTrainingReview
} from '@/features/training-reviews/api/service';
import { trainingReviewKeys } from '@/features/training-reviews/api/queries';
import type { AdminTrainingReview } from '@/features/training-reviews/api/types';
import {
  REVIEW_SCOPE_MAP,
  REVIEW_STATUS_MAP
} from '@/features/training-reviews/api/types';
import { getAdminUserDetailUrl } from '@/lib/frontend-links';
import { AssetImage } from '@/components/admin/asset-image';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function TrainingReviewDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminTrainingReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTrainingReviewDetail(Number(id));
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) toast.error('获取评价详情失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer pageTitle='评价详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='评价详情'>
        <p className='text-muted-foreground py-10 text-center'>评价不存在或加载失败</p>
      </PageContainer>
    );
  }

  const isPending = detail.status === 0;
  const isApproved = detail.status === 1;

  return (
    <PageContainer
      pageTitle='评价详情'
      pageHeaderAction={
        <Button variant='outline' onClick={() => router.back()}>
          <Icons.chevronLeft className='mr-1 h-4 w-4' />
          返回
        </Button>
      }
    >
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge>{REVIEW_SCOPE_MAP[detail.reviewScope] ?? detail.reviewScope}</Badge>
          <Badge variant='outline'>
            {REVIEW_STATUS_MAP[detail.status] ?? detail.status}
          </Badge>
          <InlineAuditActions
            showApprove={isPending || detail.status === -1 || detail.status === 2}
            showReject={isPending}
            showHide={isApproved}
            subjectLabel={detail.commentText?.slice(0, 40) || '该评价'}
            onApprove={() => approveTrainingReview(detail.id)}
            onReject={(reason) => rejectTrainingReview(detail.id, reason)}
            onHide={() => hideTrainingReview(detail.id)}
            invalidateKey={trainingReviewKeys.all}
          />
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <InfoItem label='评价ID' value={String(detail.id)} />
          <InfoItem
            label='评价人'
            value={
              detail.submitterName ? (
                <Link
                  href={getAdminUserDetailUrl(detail.userId)}
                  className='text-primary hover:underline'
                >
                  {detail.submitterName}（ID: {detail.userId}）
                </Link>
              ) : (
                `用户 #${detail.userId}`
              )
            }
          />
          <InfoItem
            label='评价类型'
            value={REVIEW_SCOPE_MAP[detail.reviewScope] ?? detail.reviewScope}
          />
          <InfoItem
            label='关联对象'
            value={detail.targetDisplayName || detail.courseTitle || detail.expertName || '-'}
          />
          {detail.caseId != null ? (
            <InfoItem
              label='案例 ID'
              value={
                <Link
                  href={`/dashboard/trainers/cases/${detail.caseId}`}
                  className='text-primary hover:underline'
                >
                  {detail.caseId}
                </Link>
              }
            />
          ) : null}
          <InfoItem
            label='审核人'
            value={
              detail.reviewedBy
                ? (
                  <Link
                    href={getAdminUserDetailUrl(detail.reviewedBy)}
                    className='text-primary hover:underline'
                  >
                    用户 #{detail.reviewedBy}
                  </Link>
                )
                : '-'
            }
          />
          <InfoItem label='培训企业' value={detail.clientCompany || '-'} />
          <InfoItem label='联系方式' value={detail.submitterContact || '-'} />
          <InfoItem label='培训时间' value={detail.trainingDate || '-'} />
          <InfoItem label='培训地点' value={detail.trainingLocation || '-'} />
          <InfoItem label='培训主题' value={detail.courseTitle || '-'} />
          <InfoItem
            label='评分'
            value={`内容 ${detail.ratingContent} / 授课 ${detail.ratingTeaching} / 服务 ${detail.ratingService}`}
          />
          <InfoItem label='提交时间' value={new Date(detail.createdAt).toLocaleString('zh-CN')} />
        </div>

        <div>
          <h3 className='mb-2 font-medium'>评价内容</h3>
          <p className='text-sm leading-relaxed whitespace-pre-wrap'>{detail.commentText}</p>
        </div>

        {detail.rejectReason ? (
          <div>
            <h3 className='mb-2 font-medium text-destructive'>驳回原因</h3>
            <p className='text-sm'>{detail.rejectReason}</p>
          </div>
        ) : null}

        {detail.photoUrls?.length ? (
          <div>
            <h3 className='mb-2 font-medium'>现场照片</h3>
            <div className='flex flex-wrap gap-3'>
              {detail.photoUrls.map((url) => (
                <AssetImage
                  key={url}
                  src={url}
                  alt='现场照片'
                  width={160}
                  height={120}
                  className='rounded-lg object-cover'
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}

function InfoItem({
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
