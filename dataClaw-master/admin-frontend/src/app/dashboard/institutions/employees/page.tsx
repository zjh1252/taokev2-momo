import PageContainer from '@/components/layout/page-container';
import EmployeeListingPage from '@/features/institution-employees/components/employee-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '机构员工列表'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InstitutionEmployeesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='机构员工列表'
      pageDescription='查看和管理平台所有机构员工信息'
    >
      <EmployeeListingPage />
    </PageContainer>
  );
}
