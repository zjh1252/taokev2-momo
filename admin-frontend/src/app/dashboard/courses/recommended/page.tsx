import PageContainer from '@/components/layout/page-container';
import { RecommendationListing } from '@/features/recommendations/components/recommendation-listing';
import { COURSE_RECOMMENDATION_CONFIG } from '@/features/recommendations/constants/configs';

export const metadata = {
  title: '推荐课程'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='推荐课程'
      pageDescription='管理首页热门内训课与线下公开课推荐位'
    >
      <RecommendationListing config={COURSE_RECOMMENDATION_CONFIG} />
    </PageContainer>
  );
}
