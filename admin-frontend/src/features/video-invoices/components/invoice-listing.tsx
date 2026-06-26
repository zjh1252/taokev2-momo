import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { videoInvoiceKeys } from '../api/queries';
import { getVideoInvoicesFromServer } from '../api/server-service';
import { VideoInvoicesTable } from './invoices-table';

export default async function VideoInvoiceListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: videoInvoiceKeys.list(filters),
      queryFn: () => getVideoInvoicesFromServer(filters)
    });
  } catch {
    // 后端未启动时由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoInvoicesTable />
    </HydrationBoundary>
  );
}
