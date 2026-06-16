import PageContainer from '@/components/layout/page-container';
import MessageListingPage from '@/features/trainer-messages/components/message-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '留言管理',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TrainerMessagesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='留言管理'
      pageDescription='查看用户向专家提交的留言，按状态筛选并标记处理进度'
    >
      <MessageListingPage />
    </PageContainer>
  );
}
