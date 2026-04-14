import PageContainer from '@/components/layout/page-container';
import AssistantApplicationListingPage from '@/features/assistants/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: '助理申请' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function AssistantApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='助理申请'
      pageDescription='审核专家助理入驻申请'
    >
      <AssistantApplicationListingPage />
    </PageContainer>
  );
}
