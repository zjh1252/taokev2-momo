import PageContainer from '@/components/layout/page-container';
import AgentApplicationListingPage from '@/features/agents/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: '经纪人申请' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function AgentApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (<PageContainer scrollable={false} pageTitle='经纪人申请' pageDescription='审核专家经纪人入驻申请'><AgentApplicationListingPage /></PageContainer>);
}
