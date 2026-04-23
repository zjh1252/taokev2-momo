import PageContainer from '@/components/layout/page-container';
import CertListingPage from '@/features/trainer-certifications/components/listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '专业认证审核'
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
      pageTitle='专业认证'
      pageDescription='审核专家提交的专业资质证书、行业资格、获奖证明等附件'
    >
      <CertListingPage dimension='professional' />
    </PageContainer>
  );
}
