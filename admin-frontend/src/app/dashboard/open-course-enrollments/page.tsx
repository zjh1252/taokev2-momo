import PageContainer from '@/components/layout/page-container';
import EnrollmentListingPage from '@/features/open-course-enrollments/components/enrollment-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '公开课报名',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function OpenCourseEnrollmentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='公开课报名'
      pageDescription='管理公开课详情页提交的报名线索，跟进处理状态与备注'
    >
      <EnrollmentListingPage />
    </PageContainer>
  );
}
