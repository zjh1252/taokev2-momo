import { AddLinkButton } from '@/components/admin/add-link-button';
import PageContainer from '@/components/layout/page-container';
import BookListingPage from '@/features/books/components/book-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '著作列表'
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
      pageTitle='著作列表'
      pageDescription='查看和管理平台所有著作信息'
      pageHeaderAction={
        <AddLinkButton href='/dashboard/books/list/new' label='添加著作' />
      }
    >
      <BookListingPage />
    </PageContainer>
  );
}
