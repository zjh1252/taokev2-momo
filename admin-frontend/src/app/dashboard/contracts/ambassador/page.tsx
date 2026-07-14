import PageContainer from '@/components/layout/page-container';
import AllianceAmbassadorApplicationListing from '@/features/alliance-ambassadors/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '推广大使'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AllianceAmbassadorApplicationsPage({
  searchParams
}: PageProps) {
  searchParamsCache.parse(await searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='推广大使'
      pageDescription='审核淘课联盟推广大使入驻申请'
    >
      <AllianceAmbassadorApplicationListing />
    </PageContainer>
  );
}
