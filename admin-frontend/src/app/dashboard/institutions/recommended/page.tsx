import PageContainer from '@/components/layout/page-container';
import { RecommendationListing } from '@/features/recommendations/components/recommendation-listing';
import { INSTITUTION_RECOMMENDATION_CONFIG } from '@/features/recommendations/constants/configs';

export const metadata = {
  title: '推荐机构'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='推荐机构'
      pageDescription='管理机构页金牌机构推荐位'
    >
      <RecommendationListing config={INSTITUTION_RECOMMENDATION_CONFIG} />
    </PageContainer>
  );
}
