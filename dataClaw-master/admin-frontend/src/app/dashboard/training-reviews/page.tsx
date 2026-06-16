import PageContainer from '@/components/layout/page-container';
import ReviewListingPage from '@/features/training-reviews/components/review-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '培训评价管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TrainingReviewsDashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='培训评价管理'
      pageDescription='审核用户对课程、专家、机构的培训评价'
    >
      <ReviewListingPage />
    </PageContainer>
  );
}
