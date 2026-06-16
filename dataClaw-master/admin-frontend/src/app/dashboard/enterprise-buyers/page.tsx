import PageContainer from '@/components/layout/page-container';
import EnterpriseBuyerListingPage from '@/features/enterprise-buyers/components/enterprise-buyer-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '企业采购方列表'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EnterpriseBuyersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='企业采购方列表'
      pageDescription='查看和管理平台所有企业采购方信息'
    >
      <EnterpriseBuyerListingPage />
    </PageContainer>
  );
}
