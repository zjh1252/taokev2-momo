import PageContainer from '@/components/layout/page-container';
import EmployeeApplicationListingPage from '@/features/institution-employees/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '机构员工申请'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InstitutionEmployeeApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='机构员工申请'
      pageDescription='审核机构员工入驻申请'
    >
      <EmployeeApplicationListingPage />
    </PageContainer>
  );
}
