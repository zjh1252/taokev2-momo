import PageContainer from '@/components/layout/page-container';
import EnterpriseAgentCertListingPage from '@/features/enterprise-agent-certifications/components/listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '经纪公司资质认证审核'
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
      pageTitle='经纪公司资质认证'
      pageDescription='整体审核公司 Logo + 营业执照，整组通过/驳回'
    >
      <EnterpriseAgentCertListingPage />
    </PageContainer>
  );
}
