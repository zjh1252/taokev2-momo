import PageContainer from '@/components/layout/page-container';
import { VideoOrderDetailView } from '@/features/video-orders/components/order-detail-view';
import { getQueryClient } from '@/lib/query-client';
import { videoOrderKeys } from '@/features/video-orders/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { serverFetch } from '@/lib/server-fetch';
import type { VideoOrderDetailResponse } from '@/features/video-orders/api/types';

export const metadata = {
  title: '订单详情'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoOrderDetailPage(props: PageProps) {
  const { id } = await props.params;
  const orderId = Number(id);
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: videoOrderKeys.detail(orderId),
      queryFn: () =>
        serverFetch<VideoOrderDetailResponse['data']>(
          `/admin/video-orders/${orderId}`
        ) as Promise<VideoOrderDetailResponse>
    });
  } catch {
    // 客户端重试
  }

  return (
    <PageContainer pageTitle='订单详情' pageDescription='查看录播课订单完整信息'>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div className='animate-pulse h-40 rounded bg-muted' />}>
          <VideoOrderDetailView orderId={orderId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
