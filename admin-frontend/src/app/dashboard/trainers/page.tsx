import PageContainer from '@/components/layout/page-container';
import TrainerListingPage from '@/features/trainers/components/trainer-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '专家列表'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TrainersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='专家列表'
      pageDescription='查看和管理平台所有专家信息'
    >
      <TrainerListingPage />
    </PageContainer>
  );
}
