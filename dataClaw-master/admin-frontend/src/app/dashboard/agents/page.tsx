import PageContainer from '@/components/layout/page-container';
import AgentListingPage from '@/features/agents/components/agent-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: '经纪人列表' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function AgentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (<PageContainer scrollable={false} pageTitle='经纪人列表' pageDescription='查看和管理平台所有专家经纪人'><AgentListingPage /></PageContainer>);
}
