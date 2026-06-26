import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { videoSupplierKeys } from '../api/queries';
import { getVideoSuppliersFromServer } from '../api/server-service';
import { VideoSuppliersTable } from './suppliers-table';

export default async function VideoSupplierListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: videoSupplierKeys.list(filters),
      queryFn: () => getVideoSuppliersFromServer(filters)
    });
  } catch {
    // 后端未启动时由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoSuppliersTable />
    </HydrationBoundary>
  );
}
