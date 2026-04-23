import PageContainer from '@/components/layout/page-container';
import AgentCertListingPage from '@/features/agent-certifications/components/listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '经纪人工作认证审核'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='经纪人工作认证'
      pageDescription='按记录审核专家经纪人提交的工作经历，每条记录单独通过/驳回'
    >
      <AgentCertListingPage />
    </PageContainer>
  );
}
