import PageContainer from '@/components/layout/page-container';
import { SupplierCategoriesPanel } from '@/features/video-suppliers/components/supplier-categories-panel';
import { supplierCategoriesQueryOptions } from '@/features/video-suppliers/api/queries';
import type { SupplierCategoryNode } from '@/features/video-suppliers/api/types';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { serverFetch } from '@/lib/server-fetch';

export const metadata = {
  title: '供应商分类管理'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupplierCategoriesPage(props: PageProps) {
  const { id } = await props.params;
  const supplierId = Number(id);
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      ...supplierCategoriesQueryOptions(supplierId),
      queryFn: () =>
        serverFetch<SupplierCategoryNode[]>(
          `/admin/video-suppliers/${supplierId}/categories`
        )
    });
  } catch {
    // 客户端重试
  }

  return (
    <PageContainer
      pageTitle='供应商分类管理'
      pageDescription='维护供应商录播课分类树，支持新增、编辑与删除'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div className='animate-pulse h-40 rounded bg-muted' />}>
          <SupplierCategoriesPanel supplierId={supplierId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
