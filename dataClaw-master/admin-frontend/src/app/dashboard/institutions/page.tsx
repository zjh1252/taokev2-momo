import PageContainer from '@/components/layout/page-container';
import InstitutionListingPage from '@/features/institutions/components/institution-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '机构列表'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InstitutionsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='机构列表'
      pageDescription='查看和管理平台所有机构信息'
    >
      <InstitutionListingPage />
    </PageContainer>
  );
}
