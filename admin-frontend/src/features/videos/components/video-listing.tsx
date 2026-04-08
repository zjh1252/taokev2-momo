import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { videoKeys } from '../api/queries';
import { getVideosFromServer } from '../api/server-service';
import { VideosTable } from './videos-table';

export default function VideoListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: videoKeys.list(filters),
    queryFn: () => getVideosFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideosTable />
    </HydrationBoundary>
  );
}
