import PageContainer from '@/components/layout/page-container';
import EnrollmentListingPage from '@/features/internal-course-enrollments/components/enrollment-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '内训课报名',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InternalCourseEnrollmentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='内训课报名'
      pageDescription='管理内训课详情页提交的报名线索，跟进处理状态与备注'
    >
      <EnrollmentListingPage />
    </PageContainer>
  );
}
