import PageContainer from '@/components/layout/page-container';
import { RecommendationListing } from '@/features/recommendations/components/recommendation-listing';
import { TRAINER_RECOMMENDATION_CONFIG } from '@/features/recommendations/constants/configs';

export const metadata = {
  title: '推荐专家'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='推荐专家'
      pageDescription='管理首页/专家页推荐位，控制展示顺序与运营覆盖内容'
    >
      <RecommendationListing config={TRAINER_RECOMMENDATION_CONFIG} />
    </PageContainer>
  );
}
