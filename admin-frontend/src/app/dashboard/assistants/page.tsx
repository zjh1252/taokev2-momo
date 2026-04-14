import PageContainer from '@/components/layout/page-container';
import AssistantListingPage from '@/features/assistants/components/assistant-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: '助理列表' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function AssistantsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='助理列表'
      pageDescription='查看和管理平台所有专家助理'
    >
      <AssistantListingPage />
    </PageContainer>
  );
}
