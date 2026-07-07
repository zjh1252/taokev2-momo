import { AddLinkButton } from '@/components/admin/add-link-button';
import PageContainer from '@/components/layout/page-container';
import HighlightListingPage from '@/features/trainer-highlights/components/highlight-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '精彩瞬间管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TrainerHighlightsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='精彩瞬间管理'
      pageDescription='管理专家精彩瞬间，支持按标题或专家姓名搜索与审核'
      pageHeaderAction={
        <AddLinkButton href='/dashboard/trainers/highlights/new' label='添加精彩瞬间' />
      }
    >
      <HighlightListingPage />
    </PageContainer>
  );
}
