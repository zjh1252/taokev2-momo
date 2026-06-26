import PageContainer from '@/components/layout/page-container';
import DemandListingPage from '@/features/demands/components/demand-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '需求管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DemandsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='需求管理'
      pageDescription='查看和处理平台所有培训需求'
    >
      <DemandListingPage />
    </PageContainer>
  );
}
