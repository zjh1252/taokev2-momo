'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getTrainerCaseDetail } from '@/features/trainer-cases/api/service';
import type { TrainerCaseDetail } from '@/features/trainer-cases/api/types';
import { CaseDetailView } from '@/features/trainer-cases/components/case-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function TrainerCaseDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<TrainerCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTrainerCaseDetail(Number(id));
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) toast.error('获取案例详情失败');
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
      <PageContainer pageTitle='案例详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='案例详情'>
        <div className='text-center py-20 text-muted-foreground'>案例不存在</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      scrollable
      pageTitle='案例详情'
      pageHeaderAction={
        <Button
          variant='outline'
          onClick={() => router.push('/dashboard/trainers/cases')}
        >
          返回列表
        </Button>
      }
    >
      <CaseDetailView detail={detail} />
    </PageContainer>
  );
}
