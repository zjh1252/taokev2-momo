import { AddComingSoonButton } from '@/components/admin/add-coming-soon-button';
import PageContainer from '@/components/layout/page-container';
import CaseListingPage from '@/features/trainer-cases/components/case-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '案例列表'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TrainerCasesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='案例列表'
      pageDescription='管理专家培训案例，审核案例内容'
      pageHeaderAction={<AddComingSoonButton label='添加案例' />}
    >
      <CaseListingPage />
    </PageContainer>
  );
}
