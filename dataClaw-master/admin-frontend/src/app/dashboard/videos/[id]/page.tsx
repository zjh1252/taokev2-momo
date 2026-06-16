'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getVideoDetail } from '@/features/videos/api/service';
import type { AdminVideoDetail } from '@/features/videos/api/types';
import { VideoDetailView } from '@/features/videos/components/video-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function VideoDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminVideoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getVideoDetail(Number(id));
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) toast.error('获取录播课详情失败');
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
      <PageContainer pageTitle='录播课详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='录播课详情'>
        <div className='text-center py-20 text-muted-foreground'>录播课不存在</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      scrollable
      pageTitle='录播课详情'
      pageHeaderAction={
        <Button variant='outline' onClick={() => router.push('/dashboard/videos')}>
          返回列表
        </Button>
      }
    >
      <VideoDetailView detail={detail} />
    </PageContainer>
  );
}
