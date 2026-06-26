'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { ApplicationDetailView } from '@/components/admin/application-detail-view';
import {
  getInstitutionApplicationDetail,
  approveInstitutionApplication,
  rejectInstitutionApplication
} from '@/features/institutions/api/service';
import { institutionKeys } from '@/features/institutions/api/queries';
import type { AdminApplicationDetail } from '@/features/trainers/api/types';

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default function InstitutionApplicationDetailPage(props: PageProps) {
  const { userId } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = Number(userId);

  const fetchDetail = async () => {
    try {
      const res = await getInstitutionApplicationDetail(uid);
      setDetail(res.data);
    } catch {
      toast.error('获取申请详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [uid]);

  if (loading) {
    return (
      <PageContainer pageTitle='申请详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='申请详情'>
        <p className='text-muted-foreground py-10 text-center'>
          申请记录不存在或加载失败
        </p>
      </PageContainer>
    );
  }

  const isPending = detail.status === 2 || detail.reapplying === true;

  return (
    <PageContainer
      pageTitle='机构申请详情'
      pageDescription={detail.applicantName || `用户 ID: ${detail.userId}`}
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          {isPending ? (
            <InlineAuditActions
              showApprove
              showReject
              subjectLabel={detail.applicantName || detail.nickname || '该机构'}
              approveTitle='确认通过'
              approveDescription={`确定要通过 ${detail.applicantName || '该机构'} 的入驻/资料变更申请吗？`}
              rejectTitle='驳回申请'
              rejectDescription='请填写驳回原因，申请人将收到通知。'
              onApprove={async () => {
                await approveInstitutionApplication(detail.userId);
                toast.success('已通过');
                void fetchDetail();
              }}
              onReject={async (reason) => {
                await rejectInstitutionApplication(detail.userId, reason);
                toast.success('已驳回');
                void fetchDetail();
              }}
              invalidateKey={institutionKeys.all}
            />
          ) : null}
          <Button variant='outline' onClick={() => router.back()}>
            <Icons.chevronLeft className='mr-1 h-4 w-4' />
            返回
          </Button>
        </div>
      }
    >
      <ApplicationDetailView detail={detail} />
    </PageContainer>
  );
}
