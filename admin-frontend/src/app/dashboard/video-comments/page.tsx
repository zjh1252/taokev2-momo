import PageContainer from '@/components/layout/page-container';
import VideoCommentListingPage from '@/features/video-comments/components/comment-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '录播课评论管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function VideoCommentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='评论管理'
      pageDescription='审核与管理录播课用户评论，支持单条与批量通过、驳回、删除'
    >
      <VideoCommentListingPage />
    </PageContainer>
  );
}
