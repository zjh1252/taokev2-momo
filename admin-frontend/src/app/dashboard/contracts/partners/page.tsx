import PageContainer from '@/components/layout/page-container';
import AlliancePartnerApplicationListing from '@/features/alliance-partners/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '培训合伙人'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AlliancePartnerApplicationsPage({
  searchParams
}: PageProps) {
  searchParamsCache.parse(await searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='培训合伙人'
      pageDescription='审核淘课联盟培训合伙人入驻申请'
    >
      <AlliancePartnerApplicationListing />
    </PageContainer>
  );
}
