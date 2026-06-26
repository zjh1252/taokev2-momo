'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getTrainerHighlightDetail } from '@/features/trainer-highlights/api/service';
import type { TrainerHighlightDetail } from '@/features/trainer-highlights/api/types';
import { HighlightDetailView } from '@/features/trainer-highlights/components/highlight-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function TrainerHighlightDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<TrainerHighlightDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTrainerHighlightDetail(Number(id));
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) toast.error('获取精彩瞬间详情失败');
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
      <PageContainer pageTitle='精彩瞬间详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='精彩瞬间详情'>
        <div className='text-center py-20 text-muted-foreground'>精彩瞬间不存在</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      scrollable
      pageTitle='精彩瞬间详情'
      pageHeaderAction={
        <Button
          variant='outline'
          onClick={() => router.push('/dashboard/trainers/highlights')}
        >
          返回列表
        </Button>
      }
    >
      <HighlightDetailView detail={detail} />
    </PageContainer>
  );
}
