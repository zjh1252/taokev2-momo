import PageContainer from '@/components/layout/page-container';
import WordListingPage from '@/features/sensitive-words/components/word-listing';
import { SensitiveWordPageActions } from '@/features/sensitive-words/components/page-actions';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '敏感词管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SensitiveWordsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='敏感词管理'
      pageDescription='管理系统敏感词库，支持批量导入和手动维护'
      pageHeaderAction={<SensitiveWordPageActions />}
    >
      <WordListingPage />
    </PageContainer>
  );
}
