import PageContainer from '@/components/layout/page-container';
import VideoSupplierListingPage from '@/features/video-suppliers/components/supplier-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '录播课供应商管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function VideoSuppliersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='供应商管理'
      pageDescription='管理录播课供应商账号，维护分类体系与供应商视频资源'
    >
      <VideoSupplierListingPage />
    </PageContainer>
  );
}
