import PageContainer from '@/components/layout/page-container';
import PlanListingPage from '@/features/courses/components/plan-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '排课管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PlansPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='排课管理'
      pageDescription='查看和管理所有公开课的开课计划安排'
    >
      <PlanListingPage />
    </PageContainer>
  );
}
