import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { videoCommentKeys } from '../api/queries';
import { getVideoCommentsFromServer } from '../api/server-service';
import { VideoCommentsTable } from './comments-table';

export default async function VideoCommentListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: videoCommentKeys.list(filters),
      queryFn: () => getVideoCommentsFromServer(filters)
    });
  } catch {
    // 后端未启动时由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoCommentsTable />
    </HydrationBoundary>
  );
}
