import PageContainer from '@/components/layout/page-container';
import InstitutionCertListingPage from '@/features/institution-certifications/components/listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '机构公司资料审核'
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
      pageTitle='机构公司资料'
      pageDescription='整体审核培训机构提交的公司资料，整组通过/驳回'
    >
      <InstitutionCertListingPage />
    </PageContainer>
  );
}
