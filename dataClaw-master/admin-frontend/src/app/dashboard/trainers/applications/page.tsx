import PageContainer from '@/components/layout/page-container';
import ApplicationListingPage from '@/features/trainers/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '专家申请'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TrainerApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='专家申请'
      pageDescription='审核专家入驻申请，通过后专家档案正式生效'
    >
      <ApplicationListingPage />
    </PageContainer>
  );
}
