import PageContainer from '@/components/layout/page-container';
import EAApplicationListingPage from '@/features/enterprise-agents/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: '经纪公司申请' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function EnterpriseAgentApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (<PageContainer scrollable={false} pageTitle='经纪公司申请' pageDescription='审核专家经纪公司入驻申请'><EAApplicationListingPage /></PageContainer>);
}
