'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getTrainerDetail } from '@/features/trainers/api/service';
import type { AdminTrainerDetail } from '@/features/trainers/api/types';
import { TrainerDetailView } from '@/features/trainers/components/trainer-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function TrainerDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
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

  return (
    <PageContainer
      pageTitle='专家详情'
      pageDescription={detail.name || `专家 ID: ${detail.id}`}
      pageHeaderAction={
        <Button variant='outline' onClick={() => router.back()}>
          <Icons.chevronLeft className='mr-1 h-4 w-4' />
          返回
        </Button>
      }
    >
      <TrainerDetailView detail={detail} />
    </PageContainer>
  );
}
