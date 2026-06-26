import PageContainer from '@/components/layout/page-container';
import InstitutionApplicationListingPage from '@/features/institutions/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '机构申请'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InstitutionApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='机构申请'
      pageDescription='审核机构入驻申请，通过后机构档案正式发布'
    >
      <InstitutionApplicationListingPage />
    </PageContainer>
  );
}
