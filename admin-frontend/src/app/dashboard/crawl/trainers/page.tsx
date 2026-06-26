import PageContainer from '@/components/layout/page-container';
import { CrawledTrainersPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '爬取专家'
};

export default function CrawledTrainersPage() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='爬取专家'
      pageDescription='查看从外部网站爬取的专家数据，审核后导入正式库'
    >
      <CrawledTrainersPanel />
    </PageContainer>
  );
}
