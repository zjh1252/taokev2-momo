import { AddComingSoonButton } from '@/components/admin/add-coming-soon-button';
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
      pageDescription='管理专家精彩瞬间，审核图片与视频内容'
      pageHeaderAction={<AddComingSoonButton label='添加精彩瞬间' />}
    >
      <HighlightListingPage />
    </PageContainer>
  );
}
