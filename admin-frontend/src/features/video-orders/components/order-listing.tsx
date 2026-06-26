import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { videoOrderKeys } from '../api/queries';
import { getVideoOrdersFromServer } from '../api/server-service';
import { VideoOrdersTable } from './orders-table';

export default async function VideoOrderListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: videoOrderKeys.list(filters),
      queryFn: () => getVideoOrdersFromServer(filters)
    });
  } catch {
    // 后端未启动时由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoOrdersTable />
    </HydrationBoundary>
  );
}
