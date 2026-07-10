import PageContainer from '@/components/layout/page-container';
import { CrawlJobsPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '任务进程'
};

export default function CrawlJobsPage() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='任务进程'
      pageDescription='查看和管理所有数据采集任务进程'
    >
      <CrawlJobsPanel />
    </PageContainer>
  );
}
