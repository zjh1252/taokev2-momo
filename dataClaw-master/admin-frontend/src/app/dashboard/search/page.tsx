import PageContainer from '@/components/layout/page-container';
import { SearchManagement } from '@/features/search/components/search-management';

export const metadata = {
  title: '全文搜索管理'
};

export default function SearchPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='全文搜索管理'
      pageDescription='管理 Elasticsearch 索引与数据重建'
    >
      <SearchManagement />
    </PageContainer>
  );
}
