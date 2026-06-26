import PageContainer from '@/components/layout/page-container';
import CertListingPage from '@/features/trainer-certifications/components/listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '学历认证审核'
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
      pageTitle='学历认证'
      pageDescription='按记录审核专家提交的学历经历，每条记录单独通过/驳回'
    >
      <CertListingPage dimension='education' />
    </PageContainer>
  );
}
