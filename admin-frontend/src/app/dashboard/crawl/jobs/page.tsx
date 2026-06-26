import PageContainer from '@/components/layout/page-container';
import { CrawlJobsPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '爬取任务'
};

export default function CrawlJobsPage() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='爬取任务'
      pageDescription='查看和管理所有数据爬取任务'
    >
      <CrawlJobsPanel />
    </PageContainer>
  );
}
