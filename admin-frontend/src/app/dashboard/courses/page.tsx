import PageContainer from '@/components/layout/page-container';
import CourseListingPage from '@/features/courses/components/course-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '课程管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CoursesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='课程管理'
      pageDescription='查看和管理平台所有课程，审核课程上架'
    >
      <CourseListingPage />
    </PageContainer>
  );
}
