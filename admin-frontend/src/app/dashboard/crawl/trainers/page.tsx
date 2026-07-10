import PageContainer from '@/components/layout/page-container';
import { CrawledTrainersPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '审核专家'
};

export default function CrawledTrainersPage() {
  return (
    <PageContainer
      scrollable={true}
      stickyHeader={false}
      pageTitle='审核专家'
      pageDescription='查看从外部网站采集的专家数据，审核后导入正式库'
    >
      <CrawledTrainersPanel />
    </PageContainer>
  );
}
