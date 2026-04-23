import PageContainer from '@/components/layout/page-container';
import CertListingPage from '@/features/trainer-certifications/components/listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '实名认证审核'
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
      pageTitle='实名认证'
      pageDescription='审核专家提交的真实姓名 + 身份证信息，通过后方可发布课程或承接培训需求'
    >
      <CertListingPage dimension='real-name' />
    </PageContainer>
  );
}
