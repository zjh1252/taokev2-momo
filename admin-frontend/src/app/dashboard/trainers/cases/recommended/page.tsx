import PageContainer from '@/components/layout/page-container';
import { RecommendationListing } from '@/features/recommendations/components/recommendation-listing';
import { CASE_RECOMMENDATION_CONFIG } from '@/features/recommendations/constants/configs';

export const metadata = {
  title: '案例推荐管理'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='推荐管理'
      pageDescription='管理首页与专家页案例推荐位'
    >
      <RecommendationListing config={CASE_RECOMMENDATION_CONFIG} />
    </PageContainer>
  );
}
