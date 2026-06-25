'use client';



import { Suspense, useEffect, useState, use } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';

import { Button } from '@/components/ui/button';

import { Icons } from '@/components/icons';

import { getTrainerDetail } from '@/features/trainers/api/service';

import type { AdminTrainerDetail } from '@/features/trainers/api/types';

import {

  TrainerDetailView,

  type TrainerDetailMode

} from '@/features/trainers/components/trainer-detail-view';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';

import { approveApplication, rejectApplication } from '@/features/trainers/api/service';

import { trainerKeys } from '@/features/trainers/api/queries';



type PageProps = {

  params: Promise<{ id: string }>;

};



function resolveMode(from: string | null): TrainerDetailMode {

  return from === 'applications' ? 'application' : 'full';

}



export default function TrainerDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <PageContainer pageTitle='专家详情'>
          <div className='flex items-center justify-center py-20'>
            <Icons.spinner className='h-6 w-6 animate-spin' />
          </div>
        </PageContainer>
      }
    >
      <TrainerDetailPageInner {...props} />
    </Suspense>
  );
}

function TrainerDetailPageInner(props: PageProps) {

  const { id } = use(props.params);

  const router = useRouter();

  const searchParams = useSearchParams();

  const mode = resolveMode(searchParams.get('from'));

  const backHref =

    mode === 'application' ? '/dashboard/trainers/applications' : '/dashboard/trainers';



  const [detail, setDetail] = useState<AdminTrainerDetail | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    let cancelled = false;

    (async () => {

      try {

        const res = await getTrainerDetail(Number(id));

        if (!cancelled) setDetail(res.data);

      } catch {

        if (!cancelled) toast.error('获取专家详情失败');

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

      <PageContainer pageTitle='专家详情'>

        <div className='flex items-center justify-center py-20'>

          <Icons.spinner className='h-6 w-6 animate-spin' />

        </div>

      </PageContainer>

    );

  }



  if (!detail) {

    return (

      <PageContainer pageTitle='专家详情'>

        <p className='text-muted-foreground py-10 text-center'>

          专家不存在或加载失败

        </p>

      </PageContainer>

    );

  }



  const trainerRole = detail.roles?.find((r) => r.role === 'TRAINER');

  const showApplicationAudit =

    mode === 'application' &&

    (trainerRole?.reapplying === true || trainerRole?.status === 2);



  const pageTitle =

    mode === 'application' ? '专家申请详情' : '专家详情';



  return (

    <PageContainer

      pageTitle={pageTitle}

      pageDescription={detail.name || `专家 ID: ${detail.id}`}

      pageHeaderAction={

        <div className='flex items-center gap-2'>

          {showApplicationAudit && detail.userId ? (

            <InlineAuditActions

              showApprove

              showReject

              subjectLabel={detail.name || '该专家'}

              approveTitle='确认通过'

              approveDescription={`确定要通过 ${detail.name || '该专家'} 的入驻/资料变更申请吗？`}

              rejectTitle='驳回申请'

              rejectDescription='请填写驳回原因，申请人将收到通知。'

              onApprove={async () => {

                await approveApplication(detail.userId);

                const res = await getTrainerDetail(Number(id));

                setDetail(res.data);

              }}

              onReject={async (reason) => {

                await rejectApplication(detail.userId, reason);

                const res = await getTrainerDetail(Number(id));

                setDetail(res.data);

              }}

              invalidateKey={trainerKeys.all}

            />

          ) : null}

          <Button variant='outline' onClick={() => router.push(backHref)}>

            <Icons.chevronLeft className='mr-1 h-4 w-4' />

            返回

          </Button>

        </div>

      }

    >

      <TrainerDetailView

        detail={detail}

        mode={mode}

        onUpdated={setDetail}

      />

    </PageContainer>

  );

}

