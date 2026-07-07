import PageContainer from '@/components/layout/page-container';
import BuyerCertListingPage from '@/features/enterprise-buyer-certifications/components/listing';
import {
  BuyerCertTabsNav,
  type BuyerCertTabId
} from '@/features/enterprise-buyer-certifications/components/buyer-cert-tabs-nav';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '企业采购方资质认证'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const VALID_TABS: BuyerCertTabId[] = ['real-name', 'work'];

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const rawTab = searchParamsCache.get('certTab') ?? 'real-name';
  const certTab: BuyerCertTabId = VALID_TABS.includes(rawTab as BuyerCertTabId)
    ? (rawTab as BuyerCertTabId)
    : 'real-name';

  return (
    <PageContainer
      scrollable={false}
      pageTitle='工作认证'
      pageDescription='审核企业培训采购方提交的实名认证与工作认证资料'
    >
      <BuyerCertTabsNav activeTab={certTab} />
      <BuyerCertListingPage dimension={certTab} />
    </PageContainer>
  );
}
