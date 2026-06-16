import PageContainer from '@/components/layout/page-container';
import VideoOrderListingPage from '@/features/video-orders/components/order-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '录播课订单管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function VideoOrdersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='订单管理'
      pageDescription='管理录播课购买订单，支持筛选、刷新支付状态与查看详情'
    >
      <VideoOrderListingPage />
    </PageContainer>
  );
}
