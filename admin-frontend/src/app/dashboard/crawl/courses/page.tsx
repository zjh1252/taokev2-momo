import PageContainer from '@/components/layout/page-container';
import { CrawledCoursesPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '审核课程'
};

export default function CrawledCoursesPage() {
  return (
    <PageContainer
      scrollable={true}
      stickyHeader={false}
      pageTitle='审核课程'
      pageDescription='查看从外部网站采集的课程数据，审核后导入正式库'
    >
      <CrawledCoursesPanel />
    </PageContainer>
  );
}
