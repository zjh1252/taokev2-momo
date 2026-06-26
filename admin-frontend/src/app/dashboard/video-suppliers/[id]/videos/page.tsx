import PageContainer from '@/components/layout/page-container';
import { SupplierVideosPanel } from '@/features/video-suppliers/components/supplier-videos-panel';
import { supplierVideosQueryOptions } from '@/features/video-suppliers/api/queries';
import type { SupplierVideosResponse } from '@/features/video-suppliers/api/types';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { serverFetch } from '@/lib/server-fetch';

export const metadata = {
  title: '供应商视频管理'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupplierVideosPage(props: PageProps) {
  const { id } = await props.params;
  const supplierId = Number(id);
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      ...supplierVideosQueryOptions(supplierId, 1),
      queryFn: () =>
        serverFetch<SupplierVideosResponse['data']>(
          `/admin/video-suppliers/${supplierId}/videos?page=1&size=20`
        )
    });
  } catch {
    // 客户端重试
  }

  return (
    <PageContainer
      pageTitle='供应商视频管理'
      pageDescription='查看供应商旗下录播课，支持分类标签展示与排序调整'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div className='animate-pulse h-40 rounded bg-muted' />}>
          <SupplierVideosPanel supplierId={supplierId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
