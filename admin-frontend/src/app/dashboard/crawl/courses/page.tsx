import PageContainer from '@/components/layout/page-container';
import { CrawledCoursesPanel } from '@/features/crawl/components/crawl-management';

export const metadata = {
  title: '爬取课程'
};

export default function CrawledCoursesPage() {
  return (
    <PageContainer
      scrollable={true}
      pageTitle='爬取课程'
      pageDescription='查看从外部网站爬取的课程数据，审核后导入正式库'
    >
      <CrawledCoursesPanel />
    </PageContainer>
  );
}
