import PageContainer from '@/components/layout/page-container';
import CertListingPage from '@/features/trainer-certifications/components/listing';
import { CertTabsNav, type CertTabId } from '@/features/trainer-certifications/components/cert-tabs-nav';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '专家资质认证'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const VALID_TABS: CertTabId[] = ['real-name', 'professional', 'education', 'work'];

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const rawTab = searchParamsCache.get('certTab') ?? 'real-name';
  const certTab: CertTabId = VALID_TABS.includes(rawTab as CertTabId)
    ? (rawTab as CertTabId)
    : 'real-name';

  return (
    <PageContainer
      scrollable={false}
      pageTitle='资质认证'
      pageDescription='审核专家提交的实名、专业、学历与工作认证资料'
    >
      <CertTabsNav activeTab={certTab} />
      <CertListingPage dimension={certTab} />
    </PageContainer>
  );
}
