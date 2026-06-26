import PageContainer from '@/components/layout/page-container';
import { CrawlSourcesPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '数据源配置'
};

export default function CrawlSourcesPage() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='数据源配置'
      pageDescription='管理可爬取的外部数据源'
    >
      <CrawlSourcesPanel />
    </PageContainer>
  );
}
