import PageContainer from '@/components/layout/page-container';
import EnterpriseBuyerApplicationListingPage from '@/features/enterprise-buyers/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '企业采购方申请'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EnterpriseBuyerApplicationsPage(
  props: PageProps
) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='企业采购方申请'
      pageDescription='审核企业采购方入驻申请，通过后企业采购方角色正式生效'
    >
      <EnterpriseBuyerApplicationListingPage />
    </PageContainer>
  );
}
