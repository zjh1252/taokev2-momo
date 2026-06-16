import PageContainer from '@/components/layout/page-container';
import VideoInvoiceListingPage from '@/features/video-invoices/components/invoice-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '录播课发票管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function VideoInvoicesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='发票管理'
      pageDescription='处理录播课订单发票申请，支持按订单、视频、用户筛选及批量开票'
    >
      <VideoInvoiceListingPage />
    </PageContainer>
  );
}
